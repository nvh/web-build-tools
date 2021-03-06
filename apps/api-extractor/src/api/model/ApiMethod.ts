// Copyright (c) Microsoft Corporation. All rights reserved. Licensed under the MIT license.
// See LICENSE in the project root for license information.

import { ApiItemKind } from './ApiItem';
import { ApiDeclarationMixin, IApiDeclarationMixinOptions } from '../mixins/ApiDeclarationMixin';
import { ApiStaticMixin, IApiStaticMixinOptions } from '../mixins/ApiStaticMixin';
import { ApiFunctionLikeMixin, IApiFunctionLikeMixinOptions } from '../mixins/ApiFunctionLikeMixin';
import { ApiDocumentedItem, IApiDocumentedItemOptions } from './ApiDocumentedItem';
import { ApiReleaseTagMixin, IApiReleaseTagMixinOptions } from '../mixins/ApiReleaseTagMixin';
import { Excerpt } from '../mixins/Excerpt';

/** @public */
export interface IApiMethodOptions extends
  IApiDeclarationMixinOptions,
  IApiFunctionLikeMixinOptions,
  IApiReleaseTagMixinOptions,
  IApiStaticMixinOptions,
  IApiDocumentedItemOptions {
}

/** @public */
export class ApiMethod extends ApiDeclarationMixin(ApiFunctionLikeMixin(ApiReleaseTagMixin(
  ApiStaticMixin(ApiDocumentedItem)))) {

  public readonly returnTypeExcerpt: Excerpt;

  public static getCanonicalReference(name: string, isStatic: boolean, overloadIndex: number): string {
    if (isStatic) {
      return `(${name}:static,${overloadIndex})`;
    } else {
      return `(${name}:instance,${overloadIndex})`;
    }
  }

  public constructor(options: IApiMethodOptions) {
    super(options);

    this.returnTypeExcerpt = this.getEmbeddedExcerpt('returnType');
  }

  /** @override */
  public get kind(): ApiItemKind {
    return ApiItemKind.Method;
  }

  /** @override */
  public get canonicalReference(): string {
    return ApiMethod.getCanonicalReference(this.name, this.isStatic, this.overloadIndex);
  }
}
