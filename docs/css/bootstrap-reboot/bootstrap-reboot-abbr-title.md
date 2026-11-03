---
title: "説明つきの略語に点線の下線を付ける"
description: "Bootstrap の Reboot は abbr[title] に underline dotted と help カーソルを付け、text-decoration-skip-ink を none にする。下線が文字の下端と重ならないようにする細部の調整。"
language: css
project: undefined
repo: https://github.com/twbs/bootstrap
license: MIT
copyright: "\"Copyright (c) 2011-2026 The Bootstrap Authors\""
commit: "2871f2a55ccf18af64045b8fc37529391b285900"
file: dist/css/bootstrap-reboot.css
lines: [567, 573]
function: "\"abbr[title]\""
difficulty: 2
format: 2
tags: [可読性, 移植性]
---
## ひとことで

`title` 属性を持つ略語（`abbr`）に、点線の下線とクエスチョンマークのカーソルを付けるルールです。見出し（`h1`〜`h6`）にも同じ下線が付くように、見出しの指定と同じブロックで書かれています。下線が文字の下の突起と重ならないように、`skip-ink` も止めています。

## コード

```css:line-numbers=567
  abbr[title] {
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
    cursor: help;
    -webkit-text-decoration-skip-ink: none;
    text-decoration-skip-ink: none;
  }
```

## 前提知識

- **abbr 要素**: 略語を表す HTML 要素です。`title` 属性に正式な名前を書くと、マウスを乗せたときに説明が出ます。
- **text-decoration**: 下線などの装飾を決めるプロパティです。`underline dotted` は点線の下線です。
- **text-decoration-skip-ink**: 下線が、文字の下の突起（g や y の下の部分など）を避けて引かれるかどうかを決めるプロパティです。`none` は避けずに引きます。
- **cursor: help**: 説明を示す形のマウスカーソルです。

## 何をしているか

### 1. 点線の下線を引く

```css:line-numbers=568
    -webkit-text-decoration: underline dotted;
    text-decoration: underline dotted;
```

`-webkit-text-decoration` と `text-decoration` で、点線の下線を指定しています。接頭辞付きの指定を先に書き、古い WebKit 系のブラウザでも同じ下線が出るようにしています。

### 2. 下線の切れ方とカーソル

```css:line-numbers=570
    cursor: help;
    -webkit-text-decoration-skip-ink: none;
    text-decoration-skip-ink: none;
```

`cursor: help` で説明のある語にマウスを乗せると、カーソルが説明の形になります。`skip-ink: none` は、下線が文字の下の突起を避けずに、まっすぐ引かれるようにする指定です。

## ここがすごい

- 見出しと略語という、一見関係のない要素に、同じ下線の指定をまとめています。「説明のある文字」という共通の見た目として扱っています。
- `skip-ink` を明示して、ブラウザごとの下線の切れ方を揃えています。点線が途中で切れると、説明の印として分かりにくくなるためです。
- 素直に `abbr { text-decoration: underline; }` とすると、説明のない略語にまで下線が付きます。`[title]` で条件を付けると、説明がある語だけが対象になります。
- 下線のための指定を二つの書き方で重ねている点は、古い環境を守る配慮です。

## まとめ

- `[title]` で、説明のある略語だけに下線を付けられます。
- `text-decoration-skip-ink: none` で、下線が文字の突起に途切れません。
- 見出しと略語を同じブロックで書くと、「説明がある」という見た目が統一されます。
