// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

/** @public */
export const enum ExcerptTokenKind {
  Content = 'Content',

  // Soon we will support hyperlinks to other API declarations
  Reference = 'Reference'
}

/**
 * Names used in {@link ApiDeclarationMixin.embeddedExcerptsByName}.
 *
 * @remarks
 * These strings use camelCase because they are property names for IDeclarationExcerpt.embeddedExcerpts.
 *
 * @public
 */
export type ExcerptName = 'returnType' | 'parameterType' | 'propertyType' | 'initializer';

/** @public */
export interface IExcerptTokenRange {
  readonly startIndex: number;
  readonly endIndex: number;
}

/** @public */
export interface IExcerptToken {
  readonly kind: ExcerptTokenKind;
  text: string;
}

/**
 * @remarks
 * This object must be completely JSON serializable, since it is included in IApiDeclarationMixinJson
 * @public
 */
export interface IDeclarationExcerpt {
  excerptTokens: IExcerptToken[];

  embeddedExcerpts: { [name in ExcerptName]?: IExcerptTokenRange };
}

/** @public */
export class ExcerptToken {
  public readonly kind: ExcerptTokenKind;
  public readonly text: string;

  public constructor(kind: ExcerptTokenKind, text: string) {
    this.kind = kind;
    this.text = text;
  }
}

/** @public */
export class Excerpt {
  public readonly tokenRange: IExcerptTokenRange;

  public readonly tokens: ReadonlyArray<ExcerptToken>;

  private _text: string | undefined;

  public constructor(tokens: ReadonlyArray<ExcerptToken>, tokenRange: IExcerptTokenRange) {
    this.tokens = tokens;
    this.tokenRange = tokenRange;
  }

  public get text(): string {
    if (this._text === undefined) {
      this._text = this.tokens.slice(this.tokenRange.startIndex, this.tokenRange.endIndex)
      .map(x => x.text).join('');
    }
    return this._text;
  }
}
