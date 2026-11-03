---
title: "吹き出しの文字を aria-label から取り出す attr()"
description: "content に attr(aria-label) を指定して、属性の文字をそのまま吹き出しの文字にする。背景、余白、重ねる位置をまとめて決める疑似要素のルール。"
language: css
project: undefined
repo: https://github.com/kazzkiq/balloon.css
license: MIT
copyright: "\"Copyright (c) 2016 Claudio Holanda\""
commit: "8b8e034ab288feb160c365789a153ad1babdfcf9"
file: balloon.css
lines: [14, 32]
function: "\"[aria-label][data-balloon-pos]:after\""
difficulty: 2
format: 2
tags: [イディオム, 可読性]
---
## ひとことで

`:after` の疑似要素で吹き出しの本体を作り、その中身を `content: attr(aria-label)` で `aria-label` の文字そのものにするルールです。HTML に文字を二重に書かなくても、属性の値が吹き出しの文字になります。背景色、余白、角丸、表示位置もこの一か所で決めています。

## コード

```css:line-numbers=14
  [aria-label][data-balloon-pos]:after {
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s ease-out 0.18s;
    text-indent: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    font-weight: normal;
    font-style: normal;
    text-shadow: none;
    font-size: var(--balloon-font-size);
    background: var(--balloon-color);
    border-radius: 2px;
    color: var(--balloon-text-color);
    border-radius: var(--balloon-border-radius);
    content: attr(aria-label);
    padding: .5em 1em;
    position: absolute;
    white-space: nowrap;
    z-index: 10; }
```

## 前提知識

- **content**: 疑似要素の中身を決めるプロパティです。文字列を直接書くか、`attr()` で属性の値を読み出せます。
- **attr()**: HTML の属性の値を、CSS の中で読み出す関数です。`attr(aria-label)` は、その要素の `aria-label` の文字になります。
- **white-space: nowrap**: 文字を折り返さず、一行に並べるという指定です。
- **transition**: 値が変わるときに、なめらかに変化させる指定です。`all 0.18s ease-out 0.18s` は、全部の変化を 0.18 秒かけ、0.18 秒待ってから始めます。
- **z-index**: 重なった要素の前後の順番を決める値です。大きいほど前に出ます。

## 何をしているか

### 1. 見えない状態から始める

```css:line-numbers=15
    opacity: 0;
    pointer-events: none;
    transition: all 0.18s ease-out 0.18s;
```

`opacity: 0` で最初は透明にしておき、`pointer-events: none` でマウスの操作を通します。吹き出しが見えていない間は、下にある要素をクリックできるようにするためです。`transition` は、表示と非表示を 0.18 秒かけて切り替えるための指定です。

### 2. 属性の文字を内容にする

```css:line-numbers=18
    text-indent: 0;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen, Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
    font-weight: normal;
    font-style: normal;
    text-shadow: none;
    font-size: var(--balloon-font-size);
    background: var(--balloon-color);
    border-radius: 2px;
    color: var(--balloon-text-color);
    border-radius: var(--balloon-border-radius);
    content: attr(aria-label);
```

`content: attr(aria-label)` で、この要素の `aria-label` の値が、そのまま吹き出しの文字になります。HTML 側に `aria-label="保存"` と書くだけで、表示される文字と読み上げの文字が同じになります。

### 3. 見た目と位置を決める

```css:line-numbers=29
    padding: .5em 1em;
    position: absolute;
    white-space: nowrap;
    z-index: 10; }
```

`padding: .5em 1em` で文字のまわりに余白を入れ、`white-space: nowrap` で一行に保ちます。`position: absolute` と `z-index: 10` で、要素の上に重ねて表示します。

## ここがすごい

- 文字を二回書く必要がないので、表示する文字と読み上げの文字がずれません。アクセシビリティと見た目を、一つの属性でまかなっています。
- `padding` を `.5em` のように文字の大きさを基準にして書いているので、文字を大きくしたときに余白も一緒に広がります。
- 素直に、吹き出しの文字を `span` で HTML に書くと、要素が増え、読み上げでも同じ文字が二度読まれることがあります。
- `transition` に遅延を入れているのは、マウスが一瞬触れただけで吹き出しが出ないようにするための工夫です。ちらつきを防ぐ細かい配慮になっています。

## まとめ

- `content: attr(...)` で、属性の文字をそのまま表示できます。
- 疑似要素を使うと、HTML に要素を増やさずに吹き出しを作れます。
- `transition` の遅延を入れると、ちらつきを防げます。
- `em` 単位の余白で、文字の大きさに合わせて広がります。
