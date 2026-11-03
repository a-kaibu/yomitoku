---
title: 名前の範囲を、文字を前後へたどって決める（@"..." の引用符も扱う）
description: ZLS の identifierIndexToLoc。カーソル位置の文字から、Zig の識別子の始まりと終わりを探す。@"..." の形の名前では、引用符の中を読み、改行で止める。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/offsets.zig
lines: [236, 259]
function: identifierIndexToLoc
difficulty: 3
format: 2
tags: [パース, 文字列処理, 防御的プログラミング]
---

## ひとことで

`identifierIndexToLoc` は、ソースコードの中のある位置から、その位置にある **識別子（名前）の範囲** を求める関数です。
範囲は、開始位置と終了位置（バイト単位）で表します。エディタで、名前をクリックしたときに、その名前だけを選択する場面で使われます。

Zig では、`@"hello world"` のように引用符で囲んだ名前も使えます。この関数は、通常の名前と、引用符の名前の両方を扱います。

## コード

::: code-group

```zig:line-numbers=236 [日本語訳]
pub fn identifierIndexToLoc(text: [:0]const u8, source_index: usize, range: IdentifierIndexRange) Loc {
    if (text[source_index] == '@' and text[source_index + 1] == '"') {
        const start_index = source_index + 2;
        var index: usize = start_index;
        while (true) : (index += 1) {
            switch (text[index]) {
                '\n' => break,
                '\\' => index += 1,
                '"' => {
//                     閉じの引用符も含める
                    if (range == .full) index += 1;
                    break;
                },
                else => {},
            }
        }
        return .{ .start = if (range == .full) source_index else start_index, .end = index };
    } else {
        const start: usize = source_index + @intFromBool(text[source_index] == '@');
        var index = start;
        while (isSymbolChar(text[index])) : (index += 1) {}
        return .{ .start = if (range == .full) source_index else start, .end = index };
    }
}
```

```zig:line-numbers=236 [原文]
pub fn identifierIndexToLoc(text: [:0]const u8, source_index: usize, range: IdentifierIndexRange) Loc {
    if (text[source_index] == '@' and text[source_index + 1] == '"') {
        const start_index = source_index + 2;
        var index: usize = start_index;
        while (true) : (index += 1) {
            switch (text[index]) {
                '\n' => break,
                '\\' => index += 1,
                '"' => {
                    // include the closing quote
                    if (range == .full) index += 1;
                    break;
                },
                else => {},
            }
        }
        return .{ .start = if (range == .full) source_index else start_index, .end = index };
    } else {
        const start: usize = source_index + @intFromBool(text[source_index] == '@');
        var index = start;
        while (isSymbolChar(text[index])) : (index += 1) {}
        return .{ .start = if (range == .full) source_index else start, .end = index };
    }
}
```

:::
## 前提知識

- **`Loc`**: 範囲の開始と終了を表す値です。`start` は最初のバイト、`end` は範囲の直後のバイトの位置です。
- **`[:0]const u8`**: 終端に 0 のバイトが付いた文字列です。`text[index]` が範囲外になれば、0 が見つかって止まる作りになっています。
- **`IdentifierIndexRange`（`.full` と `.name`）**: `.full` は、`@` や引用符を含めた範囲、`.name` は、名前の本体だけの範囲を表します。
- **`@"..."`**: Zig で、予約語や空白を含む名前を書くための形です。`@"my var"` は 1 つの名前です。
- **`switch` の `'\n' => break`**: 改行が来たら、ループを抜けます。引用符の名前が閉じられないまま行末に来た場合に備えています。
- **`isSymbolChar`**: 英字、数字、アンダースコアかを判定する関数です。前の記事で説明しています。

## 何をしているか

### 1. 引用符の名前かどうかを調べる

```zig:line-numbers=237
    if (text[source_index] == '@' and text[source_index + 1] == '"') {
        const start_index = source_index + 2;
```

先頭が `@"` なら、引用符の名前です。名前の本体は、`@"` の後ろから始まります。

### 2. 閉じの引用符まで進む

```zig:line-numbers=240
        while (true) : (index += 1) {
            switch (text[index]) {
                '\n' => break,
                '\\' => index += 1,
                '"' => {
                    // include the closing quote
                    if (range == .full) index += 1;
                    break;
                },
                else => {},
            }
        }
```

閉じの `"` が見つかるまで、1 文字ずつ進みます。途中の `\\` は、次の 1 文字を読み飛ばします。こうすると、`\"` のようなエスケープされた引用符を、閉じの印として誤認しません。

改行が来たら、そこで止めます。名前は 1 行の中で閉じるべきだからです。閉じの引用符が `.full` の範囲のときだけ、その 1 文字を範囲に含めます。

### 3. 範囲を返す

```zig:line-numbers=252
        return .{ .start = if (range == .full) source_index else start_index, .end = index };
```

`.full` なら `@` の位置から、`.name` なら引用符の中身の位置から始めます。終わりは `index` です。

### 4. 通常の名前は、文字が続く限り進む

```zig:line-numbers=254
        const start: usize = source_index + @intFromBool(text[source_index] == '@');
        var index = start;
        while (isSymbolChar(text[index])) : (index += 1) {}
        return .{ .start = if (range == .full) source_index else start, .end = index };
```

通常の名前は、先頭が `@`（組み込みの関数の名前など）であるかもしれません。`@intFromBool` で、`@` があれば 1 つ進めます。そのあと、`isSymbolChar` が真の間、文字を進めます。

## ここがすごい

- **1 つの関数で 2 種類の名前**: 引用符の名前と、通常の名前を、同じ戻り値の形で返せます。呼び出し側は、どちらなのかを意識せずに範囲を使えます。
- **改行で打ち切る安全策**: 閉じられていない引用符があっても、行末で止まるので、ファイル全体を読み続けることがありません。
- **エスケープを読み飛ばす**: `\` の次の文字を読み飛ばすことで、`\"` のような書き方を正しく扱えます。
- **範囲の選び方を引数で切り替え**: `.full` と `.name` を切り替えるだけで、名前の本体だけ、または記号も含めた範囲を選べます。同じ処理を、用途ごとに書き直さずに済みます。

## まとめ

- 識別子の範囲は、カーソル位置から文字を前後へたどって決めます。
- 引用符の名前では、閉じの引用符か改行まで進みます。エスケープは読み飛ばします。
- 通常の名前は、`isSymbolChar` が真の間、文字を進めます。
- 範囲の種類を引数で選べるので、用途に合わせた範囲を同じ関数で返せます。
