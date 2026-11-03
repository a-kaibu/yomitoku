---
title: "ボタンの吹き出しが外へはみ出せるようにする"
description: "button 要素の overflow を visible にして、aria-label を持つボタンの吹き出しが枠の外まで描かれるようにする。ボタンの既定の挙動を打ち消す一行。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [8, 9]
function: "\"button[aria-label][data-balloon-pos]\""
difficulty: 2
format: 2
tags: [移植性, ハック]
---
## ひとことで

`button` 要素で `aria-label` と `data-balloon-pos` を持つものに対して、`overflow: visible` を指定するルールです。ボタンは既定で、中身がはみ出ないように隠す設定を持っています。吹き出しはボタンの外側に描かれるため、この設定が残っていると、吹き出しが途中で切れてしまいます。

## コード

```css:line-numbers=8
button[aria-label][data-balloon-pos] {
  overflow: visible; }
```

## 前提知識

- **overflow**: 要素の箱からはみ出した中身を、どう扱うかを決めるプロパティです。`hidden` は隠す、`visible` は表示したままにする指定です。
- **aria-label**: 画面読み上げソフトに、その要素の名前を伝えるための属性です。ボタンのように文字がないものに付けられます。
- **data-* 属性**: 独自のデータを HTML に書くための属性です。`data-balloon-pos` は、吹き出しの位置を表します。
- **既定のスタイル**: ブラウザが button に最初から付けている設定です。はみ出しを隠すものが含まれることがあります。

## 何をしているか

### 1. ボタンの既定のはみ出し設定を打ち消す

```css:line-numbers=8
button[aria-label][data-balloon-pos] {
  overflow: visible; }
```

セレクタは、`aria-label` と `data-balloon-pos` の両方を持つ `button` だけに一致します。普通のボタンには影響しません。`overflow: visible` は、中身がボタンの枠を超えても、そのまま描くという指定です。

これで、ボタンの近くに出した吹き出しが、ボタンの外側で切れずに表示されます。

## ここがすごい

- 一般的な `[aria-label][data-balloon-pos]` のルールより、対象を `button` に絞ってから打ち消しています。ほかの要素のはみ出し設定には触れないので、副作用が少ないです。
- 必要なボタンだけに、吹き出しの仕組みが働くようになっています。`data-balloon-pos` を持たないボタンは、そのままの見た目を保ちます。
- 素直に、すべてのボタンで `overflow: visible` を指定すると、ほかのボタンの中身が飛び出す危険があります。
- 一行の上書きで、ブラウザの既定の挙動による不具合を防ぎます。ライブラリが「既定を変えない」ことと「動くこと」を両立させている例です。

## まとめ

- ボタンは既定で、はみ出した中身を隠す設定を持つことがあります。
- 吹き出しを使うボタンだけ `overflow: visible` にすると、吹き出しが切れません。
- セレクタで対象を絞ると、ほかの要素に影響を与えずに済みます。
- 属性を条件にすると、ライブラリを使う側が明示的に対象を選べます。
