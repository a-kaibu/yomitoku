---
title: 2 つの列が最初に違う位置を、先頭から 1 つずつ探す
description: Zig の std.mem.findDiff。2 つのスライスを先頭から比べ、最初に違う位置を返す。同じメモリを指していれば、比べずに答えを出す。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [824, 831]
function: findDiff
difficulty: 1
format: 2
tags: [文字列処理, アルゴリズム, 標準ライブラリ]
---

## ひとことで

`findDiff` は、2 つのスライス（配列の一部）を先頭から比べて、**最初に違う位置** を返す関数です。
たとえば `"one two"` と `"one"` は、位置 3 から違います（片方が終わっているため）。違いがなければ `null` を返します。

テキストの差分の検出や、接頭辞（先頭の共通部分）の長さを知りたいときに使えます。

## コード

```zig:line-numbers=824
pub fn findDiff(comptime T: type, a: []const T, b: []const T) ?usize {
    const shortest = @min(a.len, b.len);
    if (a.ptr == b.ptr)
        return if (a.len == b.len) null else shortest;
    var index: usize = 0;
    while (index < shortest) : (index += 1) if (a[index] != b[index]) return index;
    return if (a.len == b.len) null else shortest;
}
```
## 前提知識

- **スライス（`[]const T`）**: 配列の一部を指す「先頭の位置と長さ」の組みです。`a.len` で長さが分かります。
- **`?usize`（オプショナル型）**: 数値か `null` のどちらかを返す型です。違いが無い場合に `null` を返します。
- **`@min`**: 2 つの値の小さいほうを返す組み込み関数です。
- **`a.ptr == b.ptr`**: 2 つのスライスが同じ先頭の位置を指しているかを調べる比較です。
- **`while (...) : (index += 1) if (...) return index;`**: 条件が真の間、`index` を増やしながら繰り返す書き方です。途中の `if` で `return` すると、そこで関数を終わらせます。

## 何をしているか

### 1. 短いほうの長さを求める

```zig:line-numbers=825
    const shortest = @min(a.len, b.len);
```

2 つの長さのうち、短いほうを `shortest` にします。両方に値がある範囲は、この長さまでです。

### 2. 同じメモリなら、比べずに答えを出す

```zig:line-numbers=826
    if (a.ptr == b.ptr)
        return if (a.len == b.len) null else shortest;
```

同じ先頭を指しているなら、中身は同じです。長さも同じなら違いはないので `null`、長さが違えば、短いほうの終わりの位置が違いになります。

### 3. 先頭から 1 つずつ比べる

```zig:line-numbers=829
    while (index < shortest) : (index += 1) if (a[index] != b[index]) return index;
```

`index` を 0 から増やしながら、同じ位置の要素を比べます。最初に違う要素が見つかった時点で、その位置を返します。

### 4. 片方が終わっていた場合

```zig:line-numbers=830
    return if (a.len == b.len) null else shortest;
```

短い方の範囲がすべて同じだった場合、長さの違いが違いになります。長さが同じなら、本当に全部同じなので `null` です。

テストでは、`findDiff(u8, "one twx", "one two")` が `6` を返すことが確かめられています。6 文字目の `x` と `o` が違うからです。

## ここがすごい

- **早く止まる**: 最初の違いが見つかった時点で終わります。違いが前の方にあれば、比べる回数が少なくて済みます。
- **同じメモリの近道**: `a.ptr == b.ptr` の判定で、同じ列どうしなら 1 つずつ比べる必要がありません。
- **答えは位置だけ**: 違いの場所を 1 つの数で返すので、その位置から先を切り出したり、表示したりするのに直接使えます。
- **短い方で止める**: `shortest` を使うので、範囲外の要素を読むことがありません。

## まとめ

- 2 つの列の最初の違いは、先頭から 1 つずつ比べると見つかります。
- 違いが見つかったら、すぐにその位置を返します。
- 片方が途中で終わっていれば、短い方の長さが違いの位置になります。
- 同じメモリを指していれば、比較を省けます。
