---
title: "検索欄の×ボタンをグレースケールで控えめにする"
description: "Bootstrap の Reboot は [type=search] の cancel ボタンに cursor: pointer と filter: grayscale(1) を当て、色を消して、検索欄の中で目立ちすぎないようにする。ブラウザ独自の部品への調整。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [819, 822]
function: "\"[type=search]::-webkit-search-cancel-button\""
difficulty: 3
format: 2
tags: [ハック, 移植性]
---
## ひとことで

検索用の入力欄（`type="search"`）の右にある、×（消去）ボタンに、マウスカーソルを指の形にし、色を消すルールです。このボタンはブラウザの内部の部品で、色のついた丸として表示されることがあります。その色を消して、入力欄の中で目立ちすぎないようにしています。

## コード

```css:line-numbers=819
  [type=search]::-webkit-search-cancel-button {
    cursor: pointer;
    filter: grayscale(1);
  }
```

## 前提知識

- **type="search"**: 検索用の入力欄を表す属性値です。右側に消去ボタンが出ることがあります。
- **::-webkit-search-cancel-button**: 検索欄の消去ボタンを表す、WebKit 独自の疑似要素です。
- **filter: grayscale(1)**: 色を白黒にするフィルターです。`1` は、完全に色を失わせる値です。
- **cursor: pointer**: マウスを乗せたとき、指の形にするカーソルです。

## 何をしているか

### 1. カーソルを指の形にする

```css:line-numbers=820
    cursor: pointer;
```

ボタンにマウスを乗せると、指の形のカーソルになります。ボタンであることが、カーソルの形で伝わります。

### 2. 色を消す

```css:line-numbers=821
    filter: grayscale(1);
```

`filter: grayscale(1)` で、ボタンの色を白黒にします。消去ボタンが、入力欄の中の控えめな記号になります。

## ここがすごい

- ブラウザの内部の部品に、CSS で直接手を入れています。通常の HTML の要素では届かない場所の調整です。
- `filter` を使うので、ボタンの形そのものを作り直す必要がありません。色の変化だけで、見た目を揃えています。
- 素直に、消去ボタンを `display: none` で隠すと、利用者が入力を消す手段を失います。色を消すだけなら、機能は残ります。
- 接頭辞付きの疑似要素なので、ブラウザによって効かないこともあります。その場合でも、ボタンの機能は元のまま使えます。

## まとめ

- `::-webkit-search-cancel-button` は、検索欄の消去ボタンを表す疑似要素です。
- `filter: grayscale(1)` で、色を消して控えめにできます。
- ボタンを隠すより、見た目だけを調整する方が、機能を守れます。
