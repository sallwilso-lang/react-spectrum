/*
 * Copyright 2026 Adobe. All rights reserved.
 * This file is licensed to you under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License. You may obtain a copy
 * of the License at http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under
 * the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR REPRESENTATIONS
 * OF ANY KIND, either express or implied. See the License for the specific language
 * governing permissions and limitations under the License.
 */

import {getScrollParent} from '../../src/utils/getScrollParent';
import {isScrollable} from '../../src/utils/isScrollable';

describe('isScrollable', () => {
  let root: Element;

  beforeEach(() => {
    root = document.scrollingElement || document.documentElement;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  it('returns false for a null node', () => {
    expect(isScrollable(null)).toBe(false);
    expect(isScrollable(null, true)).toBe(false);
  });

  it.each(['auto', 'scroll'])('returns true when overflow is %s', overflow => {
    let div = document.createElement('div');
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow,
      overflowX: 'visible',
      overflowY: 'visible'
    } as CSSStyleDeclaration);

    expect(isScrollable(div)).toBe(true);
  });

  it.each(['auto', 'scroll'])('returns true when overflowX or overflowY alone is %s', overflow => {
    let div = document.createElement('div');
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow: 'visible',
      overflowX: overflow,
      overflowY: 'visible'
    } as CSSStyleDeclaration);

    expect(isScrollable(div)).toBe(true);

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: overflow
    } as CSSStyleDeclaration);

    expect(isScrollable(div)).toBe(true);
  });

  it('returns false when overflow is visible on all axes', () => {
    let div = document.createElement('div');
    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow: 'visible',
      overflowX: 'visible',
      overflowY: 'visible'
    } as CSSStyleDeclaration);

    expect(isScrollable(div)).toBe(false);
  });

  it('treats the document root as scrollable when overflow is not hidden', () => {
    jest.spyOn(window, 'getComputedStyle').mockImplementation(el => {
      if (el === root) {
        return {
          overflow: 'visible',
          overflowX: 'visible',
          overflowY: 'visible'
        } as CSSStyleDeclaration;
      }
      return {
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      } as CSSStyleDeclaration;
    });

    expect(isScrollable(root)).toBe(true);
  });

  it('does not treat the document root as scrollable when overflow is hidden', () => {
    jest.spyOn(window, 'getComputedStyle').mockImplementation(el => {
      if (el === root) {
        return {
          overflow: 'hidden',
          overflowX: 'hidden',
          overflowY: 'hidden'
        } as CSSStyleDeclaration;
      }
      return {
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      } as CSSStyleDeclaration;
    });

    expect(isScrollable(root)).toBe(false);
  });

  it('returns false for scrollable overflow without content overflow when checkForOverflow is set', () => {
    let div = document.createElement('div');
    Object.defineProperty(div, 'scrollHeight', {value: 100, configurable: true});
    Object.defineProperty(div, 'clientHeight', {value: 100, configurable: true});
    Object.defineProperty(div, 'scrollWidth', {value: 50, configurable: true});
    Object.defineProperty(div, 'clientWidth', {value: 50, configurable: true});

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow: 'auto',
      overflowX: 'auto',
      overflowY: 'auto'
    } as CSSStyleDeclaration);

    expect(isScrollable(div, true)).toBe(false);
  });

  it('returns true for scrollable overflow with vertical content overflow when checkForOverflow is set', () => {
    let div = document.createElement('div');
    Object.defineProperty(div, 'scrollHeight', {value: 200, configurable: true});
    Object.defineProperty(div, 'clientHeight', {value: 100, configurable: true});
    Object.defineProperty(div, 'scrollWidth', {value: 50, configurable: true});
    Object.defineProperty(div, 'clientWidth', {value: 50, configurable: true});

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow: 'auto',
      overflowX: 'auto',
      overflowY: 'auto'
    } as CSSStyleDeclaration);

    expect(isScrollable(div, true)).toBe(true);
  });

  it('returns true for scrollable overflow with horizontal content overflow when checkForOverflow is set', () => {
    let div = document.createElement('div');
    Object.defineProperty(div, 'scrollHeight', {value: 100, configurable: true});
    Object.defineProperty(div, 'clientHeight', {value: 100, configurable: true});
    Object.defineProperty(div, 'scrollWidth', {value: 150, configurable: true});
    Object.defineProperty(div, 'clientWidth', {value: 50, configurable: true});

    jest.spyOn(window, 'getComputedStyle').mockReturnValue({
      overflow: 'auto',
      overflowX: 'auto',
      overflowY: 'auto'
    } as CSSStyleDeclaration);

    expect(isScrollable(div, true)).toBe(true);
  });
});

describe('getScrollParent', () => {
  let root: Element;

  beforeEach(() => {
    root = document.scrollingElement || document.documentElement;
  });

  afterEach(() => {
    document.body.innerHTML = '';
    jest.restoreAllMocks();
  });

  function mockOverflow(
    map: Map<Element, {overflow?: string; overflowX?: string; overflowY?: string}>
  ) {
    jest.spyOn(window, 'getComputedStyle').mockImplementation(el => {
      let styles = map.get(el as Element) ?? {
        overflow: 'visible',
        overflowX: 'visible',
        overflowY: 'visible'
      };
      return styles as CSSStyleDeclaration;
    });
  }

  it('returns the document root when no ancestor is scrollable', () => {
    let child = document.createElement('div');
    document.body.appendChild(child);

    mockOverflow(new Map());

    expect(getScrollParent(child)).toBe(root);
  });

  it('skips a scrollable starting node and returns the nearest scrollable ancestor', () => {
    let scrollableParent = document.createElement('div');
    let scrollableChild = document.createElement('div');
    let inner = document.createElement('div');
    document.body.appendChild(scrollableParent);
    scrollableParent.appendChild(scrollableChild);
    scrollableChild.appendChild(inner);

    mockOverflow(
      new Map([
        [scrollableParent, {overflow: 'auto'}],
        [scrollableChild, {overflow: 'scroll'}]
      ])
    );

    expect(getScrollParent(scrollableChild)).toBe(scrollableParent);
  });

  it('returns the nearest scrollable ancestor for a non-scrollable descendant', () => {
    let scrollable = document.createElement('div');
    let plain = document.createElement('div');
    let child = document.createElement('div');
    document.body.appendChild(scrollable);
    scrollable.appendChild(plain);
    plain.appendChild(child);

    mockOverflow(new Map([[scrollable, {overflow: 'auto'}]]));

    expect(getScrollParent(child)).toBe(scrollable);
  });

  it('returns the document root when only the root is scrollable', () => {
    let child = document.createElement('div');
    document.body.appendChild(child);

    mockOverflow(new Map([[root, {overflow: 'visible'}]]));

    expect(getScrollParent(child)).toBe(root);
  });

  it('honors checkForOverflow when choosing a scroll parent', () => {
    let scrollable = document.createElement('div');
    let child = document.createElement('div');
    document.body.appendChild(scrollable);
    scrollable.appendChild(child);

    Object.defineProperty(scrollable, 'scrollHeight', {value: 100, configurable: true});
    Object.defineProperty(scrollable, 'clientHeight', {value: 100, configurable: true});
    Object.defineProperty(scrollable, 'scrollWidth', {value: 50, configurable: true});
    Object.defineProperty(scrollable, 'clientWidth', {value: 50, configurable: true});

    mockOverflow(new Map([[scrollable, {overflow: 'auto'}]]));

    expect(getScrollParent(child, true)).toBe(root);
  });
});
