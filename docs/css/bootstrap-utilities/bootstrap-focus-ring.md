---
title: "キーボードで移動したときだけ見える太い枠線"
description: "Bootstrap の .focus-ring:focus-visible は、キーボード操作のときだけ outline を出す。枠の太さと色は CSS 変数で決まり、テーマごとに変えられる。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-utilities.css
lines: [484, 486]
function: "\".focus-ring:focus-visible\""
difficulty: 2
format: 2
tags: [アクセシビリティ, 移植性]
---
## ひとことで

`focus-ring` クラスを付けた要素に、キーボードでフォーカスしたときだけ太い枠線を出すユーティリティです。`:focus-visible` を使うので、マウスでクリックした場合には枠が出ません。枠の太さと色は変数から取られ、テーマに合わせて変えられます。

## コード

```css:line-numbers=484
  .focus-ring:focus-visible {
    outline: var(--bs-focus-ring-width) solid var(--bs-theme-focus-ring, var(--bs-focus-ring-color));
  }
```

## 前提知識

- **:focus-visible**: キーボード操作などでフォーカスの枠を見せるべき場合だけ一致する疑似クラスです。
- **outline**: 要素の外側に描かれる枠線です。箱の大きさには影響しません。
- **CSS 変数の二段フォールバック**: `var(--bs-theme-focus-ring, var(--bs-focus-ring-color))` は、テーマ用の変数があればそれを、なければ既定の変数を使います。
- **ユーティリティクラス**: 一つのクラスで一つの見た目を付けるための小さな部品です。

## 何をしているか

### 1. キーボードのフォーカスだけに条件を付ける

```css:line-numbers=484
  .focus-ring:focus-visible {
```

`.focus-ring:focus-visible` は、この部品にキーボードでフォーカスが当たったときだけ一致します。マウスのクリックでは、枠は出ません。

### 2. 枠線の太さと色

```css:line-numbers=485
    outline: var(--bs-focus-ring-width) solid var(--bs-theme-focus-ring, var(--bs-focus-ring-color));
```

`outline` の太さは `--bs-focus-ring-width`、色はテーマの変数から取ります。テーマ用の変数が定義されていれば、そちらが優先されるので、サイトごとに色を変えられます。

## ここがすごい

- フォーカスの枠を、キーボードの利用者だけに見せるという配慮が、クラスの名前の中に組み込まれています。
- 色の指定が二段の変数で、ライブラリの既定とテーマの調整を両立させています。
- 素直に `outline` を直接書くと、マウスのクリックでも枠が出て、見た目が煩くなります。`:focus-visible` を使うことで、二つの場面を分けられます。
- `outline` は箱の大きさを変えないので、フォーカスの枠を出してもレイアウトがずれません。

## まとめ

- `:focus-visible` で、キーボード操作のときだけ枠を出せます。
- `outline` は箱の大きさを変えずに、強調の枠を描けます。
- 色と太さを変数にすると、テーマごとの調整が簡単になります。
