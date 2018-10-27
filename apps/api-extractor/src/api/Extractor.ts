// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import * as path from 'path';
import * as ts from 'typescript';
import lodash = require('lodash');
import colors = require('colors');

import {
  JsonFile,
  JsonSchema,
  Path,
  FileSystem,
  IPackageJson,
  FileConstants,
  NewlineKind
} from '@microsoft/node-core-library';
import {
  IExtractorConfig,
  IExtractorProjectConfig,
  IExtractorDtsRollupConfig,
  IExtractorApiJsonFileConfig
} from './IExtractorConfig';
import { ILogger } from './ILogger';
import { ExtractorContext } from '../analyzer/ExtractorContext';
import { DtsRollupGenerator, DtsRollupKind } from '../generators/DtsRollupGenerator';
import { MonitoredLogger } from './MonitoredLogger';
import { TypeScriptMessageFormatter } from '../analyzer/TypeScriptMessageFormatter';
import { ModelBuilder } from '../generators/ModelBuilder';
import { ApiPackage } from './model/ApiPackage';

/**
 * Options for {@link Extractor.processProject}.
 * @public
 */
export interface IAnalyzeProjectOptions {
  /**
   * If omitted, then the {@link IExtractorConfig.project} config will be used by default.
   */
  projectConfig?: IExtractorProjectConfig;
}

/**
 * Runtime options for Extractor.
 *
 * @public
 */
export interface IExtractorOptions {
  /**
   * If IExtractorConfig.project.configType = 'runtime', then the TypeScript compiler state
   * must be provided via this option.
   */
  compilerProgram?: ts.Program;

  /**
   * Allows the caller to handle API Extractor errors; otherwise, they will be logged
   * to the console.
   */
  customLogger?: Partial<ILogger>;

  /**
   * Indicates that API Extractor is running as part of a local build, e.g. on developer's
   * machine. This disables certain validation that would normally be performed
   * for a ship/production build. For example, the *.api.ts review file is
   * automatically local in a debug build.
   *
   * The default value is false.
   */
  localBuild?: boolean;

  /**
   * By default API Extractor uses its own TypeScript compiler version to analyze your project.
   * This can often cause compiler errors due to incompatibilities between different TS versions.
   * Use this option to specify the folder path for your compiler version.
   *
   * @remarks
   * This option only applies when compiler.config.configType is set to "tsconfig"
   *
   * @beta
   */
  typescriptCompilerFolder?: string;

  /**
   * This option causes the typechecker to be invoked with the --skipLibCheck option. This option is not
   * recommended and may cause API Extractor to produce incomplete or incorrect declarations, but it
   * may be required when dependencies contain declarations that are incompatible with the TypeScript engine
   * that API Extractor uses for its analysis. If this option is used, it is strongly recommended that broken
   * dependencies be fixed or upgraded.
   *
   * @remarks
   * This option only applies when compiler.config.configType is set to "tsconfig"
   */
  skipLibCheck?: boolean;
}

/**
 * Used to invoke the API Extractor tool.
 * @public
 */
export class Extractor {
  /**
   * The JSON Schema for API Extractor config file (api-extractor-config.schema.json).
   */
  public static jsonSchema: JsonSchema = JsonSchema.fromFile(
    path.join(__dirname, '../schemas/api-extractor.schema.json'));

  /**
   * Returns the version number of the API Extractor NPM package.
   */
  public static get version(): string {
    return Extractor._getPackageJson().version;
  }

  /**
   * Returns the package name of the API Extractor NPM package.
   */
  public static get packageName(): string {
    return Extractor._getPackageJson().name;
  }

  private static _getPackageJson(): IPackageJson {
    if (Extractor._apiExtractorPackageJson === undefined) {
      const packageJsonFilename: string = path.resolve(path.join(
        __dirname, '..', '..', FileConstants.PackageJson)
      );
      Extractor._apiExtractorPackageJson = JsonFile.load(packageJsonFilename) as IPackageJson;
    }
    return Extractor._apiExtractorPackageJson;
  }

  private static _apiExtractorPackageJson: IPackageJson | undefined;

  private static _defaultConfig: Partial<IExtractorConfig> = JsonFile.load(path.join(__dirname,
    '../schemas/api-extractor-defaults.json'));

  private static _declarationFileExtensionRegExp: RegExp = /\.d\.ts$/i;

  private static _defaultLogger: ILogger = {
    logVerbose: (message: string) => console.log('(Verbose) ' + message),
    logInfo: (message: string) => console.log(message),
    logWarning: (message: string) => console.warn(colors.yellow(message)),
    logError: (message: string) => console.error(colors.red(message))
  };

  private readonly _actualConfig: IExtractorConfig;
  private readonly _program: ts.Program;
  private readonly _localBuild: boolean;
  private readonly _monitoredLogger: MonitoredLogger;
  private readonly _absoluteRootFolder: string;

  /**
   * Given a list of absolute file paths, return a list containing only the declaration
   * files.  Duplicates are also eliminated.
   *
   * @remarks
   * The tsconfig.json settings specify the compiler's input (a set of *.ts source files,
   * plus some *.d.ts declaration files used for legacy typings).  However API Extractor
   * analyzes the compiler's output (a set of *.d.ts entry point files, plus any legacy
   * typings).  This requires API Extractor to generate a special file list when it invokes
   * the compiler.
   *
   * For configType=tsconfig this happens automatically, but for configType=runtime it is
   * the responsibility of the custom tooling.  The generateFilePathsForAnalysis() function
   * is provided to facilitate that.  Duplicates are removed so that entry points can be
   * appended without worrying whether they may already appear in the tsconfig.json file list.
   */
  public static generateFilePathsForAnalysis(inputFilePaths: string[]): string[] {
    const analysisFilePaths: string[] = [];

    const seenFiles: Set<string> = new Set<string>();

    for (const inputFilePath of inputFilePaths) {
      const inputFileToUpper: string = inputFilePath.toUpperCase();
      if (!seenFiles.has(inputFileToUpper)) {
        seenFiles.add(inputFileToUpper);

        if (!path.isAbsolute(inputFilePath)) {
          throw new Error('Input file is not an absolute path: ' + inputFilePath);
        }

        if (Extractor._declarationFileExtensionRegExp.test(inputFilePath)) {
          analysisFilePaths.push(inputFilePath);
        }
      }
    }

    return analysisFilePaths;
  }

  private static _applyConfigDefaults(config: IExtractorConfig): IExtractorConfig {
    // Use the provided config to override the defaults
    const normalized: IExtractorConfig  = lodash.merge(
      lodash.cloneDeep(Extractor._defaultConfig), config);

    return normalized;
  }

  public constructor(config: IExtractorConfig, options?: IExtractorOptions) {
    let mergedLogger: ILogger;
    if (options && options.customLogger) {
      mergedLogger = lodash.merge(lodash.clone(Extractor._defaultLogger), options.customLogger);
    } else {
      mergedLogger = Extractor._defaultLogger;
    }
    this._monitoredLogger = new MonitoredLogger(mergedLogger);

    this._actualConfig = Extractor._applyConfigDefaults(config);

    if (!options) {
      options = { };
    }

    this._localBuild = options.localBuild || false;

    switch (this.actualConfig.compiler.configType) {
      case 'tsconfig':
        const rootFolder: string = this.actualConfig.compiler.rootFolder;
        if (!FileSystem.exists(rootFolder)) {
          throw new Error('The root folder does not exist: ' + rootFolder);
        }

        this._absoluteRootFolder = path.normalize(path.resolve(rootFolder));

        let tsconfig: {} | undefined = this.actualConfig.compiler.overrideTsconfig;
        if (!tsconfig) {
          // If it wasn't overridden, then load it from disk
          tsconfig = JsonFile.load(path.join(this._absoluteRootFolder, 'tsconfig.json'));
        }

        const commandLine: ts.ParsedCommandLine = ts.parseJsonConfigFileContent(
          tsconfig,
          ts.sys,
          this._absoluteRootFolder
        );

        if (!commandLine.options.skipLibCheck && options.skipLibCheck) {
          commandLine.options.skipLibCheck = true;
          console.log(colors.cyan(
            'API Extractor was invoked with skipLibCheck. This is not recommended and may cause ' +
            'incorrect type analysis.'
          ));
        }

        this._updateCommandLineForTypescriptPackage(commandLine, options);

        const normalizedEntryPointFile: string = path.normalize(
          path.resolve(this._absoluteRootFolder, this.actualConfig.project.entryPointSourceFile)
        );

        // Append the normalizedEntryPointFile and remove any non-declaration files from the list
        const analysisFilePaths: string[] = Extractor.generateFilePathsForAnalysis(
          commandLine.fileNames.concat(normalizedEntryPointFile)
        );

        this._program = ts.createProgram(analysisFilePaths, commandLine.options);

        if (commandLine.errors.length > 0) {
          const errorText: string = TypeScriptMessageFormatter.format(commandLine.errors[0].messageText);
          throw new Error(`Error parsing tsconfig.json content: ${errorText}`);
        }

        break;

      case 'runtime':
        if (!options.compilerProgram) {
          throw new Error('The compiler.configType=runtime configuration was specified,'
            + ' but the caller did not provide an options.compilerProgram object');
        }

        this._program = options.compilerProgram;
        const rootDir: string | undefined = this._program.getCompilerOptions().rootDir;
        if (!rootDir) {
          throw new Error('The provided compiler state does not specify a root folder');
        }
        if (!FileSystem.exists(rootDir)) {
          throw new Error('The rootDir does not exist: ' + rootDir);
        }
        this._absoluteRootFolder = path.resolve(rootDir);
        break;

      default:
        throw new Error('Unsupported config type');
    }
  }

  /**
   * Returns the normalized configuration object after defaults have been applied.
   *
   * @remarks
   * This is a read-only object.  The caller should NOT modify any member of this object.
   * It is provided for diagnostic purposes.  For example, a build script could write
   * this object to a JSON file to report the final configuration options used by API Extractor.
   */
  public get actualConfig(): IExtractorConfig {
    return this._actualConfig;
  }

  /**
   * Invokes the API Extractor engine, using the configuration that was passed to the constructor.
   * @deprecated Use {@link Extractor.processProject} instead.
   */
  public analyzeProject(options?: IAnalyzeProjectOptions): void {
    this.processProject(options);
  }

  /**
   * Invokes the API Extractor engine, using the configuration that was passed to the constructor.
   * @param options - provides additional runtime state that is NOT part of the API Extractor
   *     config file.
   * @returns true for a successful build, or false if the tool chain should fail the build
   *
   * @remarks
   *
   * This function returns false to indicate that the build failed, i.e. the command-line tool
   * would return a nonzero exit code.  Normally the build fails if there are any errors or
   * warnings; however, if options.localBuild=true then warnings are ignored.
   */
  public processProject(options?: IAnalyzeProjectOptions): boolean {
    this._monitoredLogger.resetCounters();

    if (!options) {
      options = { };
    }

    const projectConfig: IExtractorProjectConfig = options.projectConfig ?
      options.projectConfig : this.actualConfig.project;

    // This helps strict-null-checks to understand that _applyConfigDefaults() eliminated
    // any undefined members
    if (!(this.actualConfig.policies && this.actualConfig.validationRules
      && this.actualConfig.apiJsonFile && this.actualConfig.apiReviewFile && this.actualConfig.dtsRollup)) {
      throw new Error('The configuration object wasn\'t normalized properly');
    }

    if (!Extractor._declarationFileExtensionRegExp.test(projectConfig.entryPointSourceFile)) {
      throw new Error('The entry point is not a declaration file: ' + projectConfig.entryPointSourceFile);
    }

    const context: ExtractorContext = new ExtractorContext({
      program: this._program,
      entryPointFile: path.resolve(this._absoluteRootFolder, projectConfig.entryPointSourceFile),
      logger: this._monitoredLogger,
      policies: this.actualConfig.policies,
      validationRules: this.actualConfig.validationRules
    });

    const modelBuilder: ModelBuilder = new ModelBuilder(context);
    const apiPackage: ApiPackage = modelBuilder.buildApiPackage();

    const packageBaseName: string = path.basename(context.packageName);

    const apiJsonFileConfig: IExtractorApiJsonFileConfig = this.actualConfig.apiJsonFile;

    if (apiJsonFileConfig.enabled) {
      const outputFolder: string = path.resolve(this._absoluteRootFolder, apiJsonFileConfig.outputFolder);

      const apiJsonFilename: string = path.join(outputFolder, packageBaseName + '.api.json');

      this._monitoredLogger.logVerbose('Writing: ' + apiJsonFilename);
      apiPackage.saveToJsonFile(apiJsonFilename, {
        newlineConversion: NewlineKind.CrLf,
        ensureFolderExists: true
      });
    }

    this._generateRollupDtsFiles(context);

    if (this._localBuild) {
      // For a local build, fail if there were errors (but ignore warnings)
      return this._monitoredLogger.errorCount === 0;
    } else {
      // For a production build, fail if there were any errors or warnings
      return (this._monitoredLogger.errorCount + this._monitoredLogger.warningCount) === 0;
    }
  }

  private _generateRollupDtsFiles(context: ExtractorContext): void {
    const dtsRollup: IExtractorDtsRollupConfig = this.actualConfig.dtsRollup!;
    if (dtsRollup.enabled) {
      let mainDtsRollupPath: string = dtsRollup.mainDtsRollupPath!;

      if (!mainDtsRollupPath) {
        // If the mainDtsRollupPath is not specified, then infer it from the package.json file
        if (!context.packageJson.typings) {
          this._monitoredLogger.logError('Either the "mainDtsRollupPath" setting must be specified,'
            + ' or else the package.json file must contain a "typings" field.');
          return;
        }

        // Resolve the "typings" field relative to package.json itself
        const resolvedTypings: string = path.resolve(context.packageFolder, context.packageJson.typings);

        if (dtsRollup.trimming) {
          if (!Path.isUnder(resolvedTypings, dtsRollup.publishFolderForInternal!)) {
            this._monitoredLogger.logError('The "mainDtsRollupPath" setting was not specified.'
              + ' In this case, the package.json "typings" field must point to a file under'
              + ' the "publishFolderForInternal": ' + dtsRollup.publishFolderForInternal!);
            return;
          }

          mainDtsRollupPath = path.relative(dtsRollup.publishFolderForInternal!, resolvedTypings);
        } else {
          if (!Path.isUnder(resolvedTypings, dtsRollup.publishFolder!)) {
            this._monitoredLogger.logError('The "mainDtsRollupPath" setting was not specified.'
              + ' In this case, the package.json "typings" field must point to a file under'
              + ' the "publishFolder": ' + dtsRollup.publishFolder!);
            return;
          }

          mainDtsRollupPath = path.relative(dtsRollup.publishFolder!, resolvedTypings);
        }

        this._monitoredLogger.logVerbose(
          `The "mainDtsRollupPath" setting was inferred from package.json: ${mainDtsRollupPath}`
        );
      } else {
        this._monitoredLogger.logVerbose(`The "mainDtsRollupPath" is: ${mainDtsRollupPath}`);

        if (path.isAbsolute(mainDtsRollupPath)) {
          this._monitoredLogger.logError('The "mainDtsRollupPath" setting must be a relative path'
            + ' that can be combined with one of the "publishFolder" settings.');
          return;
        }
      }

      const dtsRollupGenerator: DtsRollupGenerator = new DtsRollupGenerator(context);
      dtsRollupGenerator.analyze();

      if (dtsRollup.trimming) {
        this._generateRollupDtsFile(dtsRollupGenerator,
          path.resolve(context.packageFolder, dtsRollup.publishFolderForPublic!, mainDtsRollupPath),
          DtsRollupKind.PublicRelease);

        this._generateRollupDtsFile(dtsRollupGenerator,
          path.resolve(context.packageFolder, dtsRollup.publishFolderForBeta!, mainDtsRollupPath),
          DtsRollupKind.BetaRelease);

        this._generateRollupDtsFile(dtsRollupGenerator,
          path.resolve(context.packageFolder, dtsRollup.publishFolderForInternal!, mainDtsRollupPath),
          DtsRollupKind.InternalRelease);
      } else {
        this._generateRollupDtsFile(dtsRollupGenerator,
          path.resolve(context.packageFolder, dtsRollup.publishFolder!, mainDtsRollupPath),
          DtsRollupKind.InternalRelease); // (no trimming)
      }
    }
  }

  private _generateRollupDtsFile(dtsRollupGenerator: DtsRollupGenerator, mainDtsRollupFullPath: string,
    dtsKind: DtsRollupKind): void {

    this._monitoredLogger.logVerbose(`Writing package typings: ${mainDtsRollupFullPath}`);

    dtsRollupGenerator.writeTypingsFile(mainDtsRollupFullPath, dtsKind);
  }

  /**
   * Update the parsed command line to use paths from the specified TS compiler folder, if
   * a TS compiler folder is specified.
   */
  private _updateCommandLineForTypescriptPackage(
    commandLine: ts.ParsedCommandLine,
    options: IExtractorOptions
  ): void {
    const DEFAULT_BUILTIN_LIBRARY: string = 'lib.d.ts';
    const OTHER_BUILTIN_LIBRARIES: string[] = ['lib.es5.d.ts', 'lib.es6.d.ts'];

    if (options.typescriptCompilerFolder) {
      commandLine.options.noLib = true;
      const compilerLibFolder: string = path.join(options.typescriptCompilerFolder, 'lib');

      let foundBaseLib: boolean = false;
      const filesToAdd: string[]  = [];
      for (const libFilename of commandLine.options.lib || []) {
        if (libFilename === DEFAULT_BUILTIN_LIBRARY) {
          // Ignore the default lib - it'll get added later
          continue;
        }

        if (OTHER_BUILTIN_LIBRARIES.indexOf(libFilename) !== -1) {
          foundBaseLib = true;
        }

        const libPath: string = path.join(compilerLibFolder, libFilename);
        if (!FileSystem.exists(libPath)) {
          throw new Error(`lib ${libFilename} does not exist in the compiler specified in typescriptLibPackage`);
        }

        filesToAdd.push(libPath);
      }

      if (!foundBaseLib) {
        // If we didn't find another version of the base lib library, include the default
        filesToAdd.push(path.join(compilerLibFolder, 'lib.d.ts'));
      }

      if (!commandLine.fileNames) {
        commandLine.fileNames = [];
      }

      commandLine.fileNames.push(...filesToAdd);

      commandLine.options.lib = undefined;
    }
  }
}