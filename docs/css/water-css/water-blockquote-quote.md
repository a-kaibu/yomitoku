---
title: "引用文に左の線と斜体を付ける"
description: "Water.css の blockquote は左に 4px の線を付け、上下の余白を 1.5em、内側の余白を 0.5em 1em にし、文字を斜体にする。引用の部分を、本文から切り分けて見せる書き方。"
language: css
project: undefined
repo: https://github.com/kognise/water.css
license: MIT
copyright: "\"Copyright © 2019 Kognise\""
commit: "d950cbc9f8607521587fae1aa523f85e25f8396f"
file: dist/light.css
lines: [53, 58]
function: "\"blockquote\""
difficulty: 2
format: 2
tags: [配色, 可読性]
---
## ひとことで

Water.css は、引用文を表す `blockquote` に、左の細い線と斜体の文字を付けます。他人の言葉や、本文から切り出した一節を、目で区別できるようにするためです。

## コード

```css:line-numbers=53
blockquote {
  border-left: 4px solid #0096bfab;
  margin: 1.5em 0em;
  padding: 0.5em 1em;
  font-style: italic;
}
```

## 前提知識

- **blockquote**: 引用のまとまりを表す HTML の要素です。意味として、文章の一部が引用であることを示します。
- **border-left**: 要素の左側だけに枠線を付ける指定です。引用の印として、縦の線が出ます。
- **font-style: italic**: 文字を斜体にする指定です。書き手の言葉と、引用の言葉を区別する手がかりになります。

## 何をしているか

### 1. 左の線

```css:line-numbers=54
  border-left: 4px solid #0096bfab;
```

左に 4px の青みがかった線を付けます。引用の範囲が、縦の線で示されます。

### 2. 余白と位置

```css:line-numbers=55
  margin: 1.5em 0em;
  padding: 0.5em 1em;
```

上下に 1.5em、内側に 0.5em と 1em の余白を取ります。引用文が、前後の本文から少し離れて見えます。

### 3. 斜体

```css:line-numbers=57
  font-style: italic;
```

文字を斜体にします。線と合わせて、引用であることが二重に伝わります。

## ここがすごい

線と斜体という二つの手がかりで、引用を見分けられます。色や大きさを大きく変えないので、読み進める流れは保たれます。

引用は、本文の流れから少し外れた情報として読まれます。そのため、線と斜体と余白の三つで、位置と性格を同時に伝えることが役立ちます。色を強く変えないのは、引用が本文と同じ重さで読まれるべきだからです。Water.css は、引用を目立たせつつも、読み進める流れを乱さない控えめな見た目を選んでいます。

## まとめ

引用の印を、線と斜体の二つで示すと、本文と引用が自然に区別されます。
