---
title: 「よくある空白」を先に片付ける、二重ループの空白除去
description: 文字列の先頭の空白を取り除く ltrimWhitespace。最も多いスペースだけを内側のループで高速に飛ばし、まれな改行やタブは外側のループで 1 文字ずつ処理する。コピーはせず、範囲を縮めるだけ。
language: cpp
project: Folly
repo: https://github.com/facebook/folly
license: Apache-2.0
copyright: Copyright (c) Meta Platforms, Inc. and affiliates.
commit: "d4d6587a595d5507fde85b9c5797e013b9120892"
file: folly/String.cpp
lines: [127, 147]
function: folly::ltrimWhitespace
difficulty: 1
format: 2
tags: [文字列処理, 最適化, 可読性]
---

## ひとことで

`ltrimWhitespace(sp)` は、文字列の **先頭にある空白文字（スペース・改行・タブ・復帰）** を取り除いた部分を返します。`"  \n hello"` なら `"hello"` です。

ループを 2 重にして、**いちばんよく出てくるスペースだけを専用の速いループで飛ばす** という工夫がされています。コメントには、この形が「実測で最も速かった」と書かれています。

## コード

::: code-group

```cpp:line-numbers=127 [日本語訳]
static inline bool is_oddspace(char c) {
  return c == '\n' || c == '\t' || c == '\r';
}

StringPiece ltrimWhitespace(StringPiece sp) {
  // ' ' 以外の空白はあまり出てこないが、確認は必要。
  // ' ' のループを oddspace とは別に回す
  // この構成が、実測で最も速かった。

  while (true) {
    while (!sp.empty() && sp.front() == ' ') {
      sp.pop_front();
    }
    if (!sp.empty() && is_oddspace(sp.front())) {
      sp.pop_front();
      continue;
    }

    return sp;
  }
}
```

```cpp:line-numbers=127 [原文]
static inline bool is_oddspace(char c) {
  return c == '\n' || c == '\t' || c == '\r';
}

StringPiece ltrimWhitespace(StringPiece sp) {
  // Spaces other than ' ' characters are less common but should be
  // checked.  This configuration where we loop on the ' '
  // separately from oddspaces was empirically fastest.

  while (true) {
    while (!sp.empty() && sp.front() == ' ') {
      sp.pop_front();
    }
    if (!sp.empty() && is_oddspace(sp.front())) {
      sp.pop_front();
      continue;
    }

    return sp;
  }
}
```

:::

## 前提知識

- **`StringPiece`**: Folly の文字列の「ビュー」です。文字列の中身は持たず、**先頭と末尾のポインタ** だけを持ちます。C++17 の `std::string_view` と似たものです。コピーしても文字列本体はコピーされません。
- **`sp.front()` / `sp.pop_front()`**: 先頭の文字を見る / 先頭を 1 文字ぶん縮める操作です。`pop_front` は先頭ポインタを 1 つ進めるだけなので、とても軽い処理です。
- **`static inline`**: `static` はこのファイルの中だけで使える関数にする指定、`inline` はインライン展開してよいというヒントです。
- **`'\n'`、`'\t'`、`'\r'`**: それぞれ改行、タブ、復帰（キャリッジリターン）の文字です。
- **`while (true) { ... continue; ... return ...; }`**: 無限ループの中で、続けるときは `continue`、終わるときは `return` で抜ける書き方です。

## 何をしているか

### 1. まれな空白を判定する関数

```cpp:line-numbers=127
static inline bool is_oddspace(char c) {
  return c == '\n' || c == '\t' || c == '\r';
}
```

`is_oddspace` は、改行・タブ・復帰のどれかなら `true` を返します。スペース `' '` はここには含めず、別に扱います。

### 2. スペースを一気に飛ばす

```cpp:line-numbers=136
  while (true) {
    while (!sp.empty() && sp.front() == ' ') {
      sp.pop_front();
```

内側の `while` は、先頭が `' '` である間、1 文字ずつ縮めます。比較は「`' '` と等しいか」の 1 回だけです。

### 3. まれな空白を 1 文字だけ処理

```cpp:line-numbers=139
    }
    if (!sp.empty() && is_oddspace(sp.front())) {
      sp.pop_front();
      continue;
```

スペースが途切れたら、その文字がまれな空白かを調べます。そうなら 1 文字縮めて `continue` し、外側のループの先頭に戻ります。そこでまたスペースの高速ループが走ります。

### 4. どちらでもなければ終わり

```cpp:line-numbers=144

```

スペースでもまれな空白でもない文字が来たら、残りの範囲を返します。

`"  \n hello"` で追うと、

- 内側のループでスペース 2 個を飛ばす → `"\n hello"`
- `'\n'` はまれな空白なので 1 文字飛ばして `continue` → `" hello"`
- 内側のループでスペース 1 個 → `"hello"`
- `'h'` はどちらでもないので `"hello"` を返す

となります。

`rtrimWhitespace`も、`back()` と `pop_back()` を使って末尾から同じことをしています。

## ここがすごい

### 判定の回数を減らす

素直に書くと、

```cpp
while (!sp.empty() && isspace(sp.front())) sp.pop_front();
```

です。これは 1 文字ごとに「4 種類の空白のどれか」を判定します（`isspace` はロケール依存の判定も含みます）。

実際のテキストでは、インデントなどで連続するのはほとんどスペースです。そこで「スペースか」の 1 回の比較だけで回るループを内側に置き、残りの判定はスペースの連続が途切れたときだけ行うようにしています。

コメントは、この構成が **実際に測って最速だった** ことを書き残しています。根拠が実測であることが明示されているので、後から読む人が「もっと素直に書き直そう」とする前に立ち止まれます。

### コピーしない

`StringPiece` を値で受け取り、先頭を縮めたものを返すだけなので、文字列の中身は 1 バイトもコピーされません。返り値も元の文字列の一部を指しています。ただし、そのぶん **元の文字列が先に消えると、返り値は無効になる** ことには注意が必要です。

### 範囲の定義がはっきりしている

扱う空白は「スペース・改行・タブ・復帰」の 4 つだけで、ロケールに依存しません。プログラムの設定によって結果が変わることがありません。

## まとめ

- よく出る場合だけを処理する速いループを内側に置くと、全体が速くなることがある。
- 「実測で最速だった」という根拠はコメントに残しておくと、後の改変から守れる。
- 文字列ビューは、先頭や末尾を縮めるだけでトリムでき、コピーが要らない。
- ビューを返す関数では、元の文字列の寿命に気をつける。
