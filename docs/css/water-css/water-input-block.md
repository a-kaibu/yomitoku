---
title: "入力欄を一行の箱にして改行させる"
description: "Water.css は、チェックボックスとラジオを除く input と select を display: block にし、入力欄ごとに一行を使わせる。ラベルと入力欄を縦に積むフォームの基本の形。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [92, 95]
function: "\"input:not([type='checkbox']):not([type='radio']), select\""
difficulty: 2
format: 2
tags: [フォーム, レイアウト]
---
## ひとことで

Water.css は、文字の入力欄と選択の欄を、一行を占める箱にします。ラベルの次の行に入力欄が来る、縦に積んだフォームの形を作ります。

## コード

```css:line-numbers=92
input:not([type='checkbox']):not([type='radio']),
select {
  display: block;
}
```

## 前提知識

- **display: block**: 要素を行全体の箱にする指定です。前後で改行され、次の要素は必ず下に来ます。
- **inline-block と block**: 既定の input は文字と並ぶ箱です。block にすると、並ぶことを止められます。
- **:not() の組み合わせ**: 条件を複数重ねると、チェックボックスとラジオを除外できます。これらは、文字と並んで置かれるのが自然な部品です。

## 何をしているか

### 1. 除外する種類

```css:line-numbers=92
input:not([type='checkbox']):not([type='radio']),
```

チェックボックスとラジオを除いた input を選びます。ここでは、文字と並ぶ形のまま残します。

### 2. 箱にして改行する

```css:line-numbers=93
select {
  display: block;
```

選択の欄と、残りの input を block にします。入力欄が一行を使い、縦に積まれます。

## ここがすごい

チェックボックスとラジオは既定の並びを残し、文字の入力欄は縦に積む。この使い分けを、一つのセレクタで表現しています。

縦に積まれた入力欄は、ラベルと欄の対応が上から下へ読めるため、フォームの記入がしやすくなります。チェックボックスやラジオは、選択肢として横に並んだほうが自然な場合が多いため、既定の並びを残しています。どの要素を縦にし、どの要素を横にするかは、フォームの読みやすさを左右する大切な判断です。

## まとめ

block にする対象を、種類で絞ると、入力欄は縦に、選択肢は横に並ぶ、読みやすいフォームになります。
