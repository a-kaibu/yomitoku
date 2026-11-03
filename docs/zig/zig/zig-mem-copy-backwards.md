---
title: 末尾から 1 要素ずつコピーして、後ろへずれる重なりに対応する
description: Zig 標準ライブラリの mem.copyBackwards。コピー元の末尾から逆向きに代入し、コピー先がコピー元より後ろにある重なりでも、読む前に壊さないようにする。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/mem.zig
lines: [246, 257]
function: copyBackwards
difficulty: 3
format: 2
tags: [メモリ管理, 低レイヤ, 最適化]
---

## ひとことで

`copyBackwards` は、末尾から先頭へ向かって要素をコピーする関数です。コピー先がコピー元より後ろにあって領域が重なる場合でも、読む前に値を壊さずにコピーできます。

## コード

::: code-group

```zig:line-numbers=246 [日本語訳]
pub fn copyBackwards(comptime T: type, dest: []T, source: []const T) void {
    // TODO: 配列全体のチェックを手で書く代わりに、コンパイラが検出すべき。
    // 実行時の安全チェックを切る代わりに、この形のループを検出して省くべき。
    // ループの安全チェックを自動的に省くべき。
    @setRuntimeSafety(false);
    assert(dest.len >= source.len);
    var i = source.len;
    while (i > 0) {
        i -= 1;
        dest[i] = source[i];
    }
}
```

```zig:line-numbers=246 [原文]
pub fn copyBackwards(comptime T: type, dest: []T, source: []const T) void {
    // TODO instead of manually doing this check for the whole array
    // and turning off runtime safety, the compiler should detect loops like
    // this and automatically omit safety checks for loops
    @setRuntimeSafety(false);
    assert(dest.len >= source.len);
    var i = source.len;
    while (i > 0) {
        i -= 1;
        dest[i] = source[i];
    }
}
```

:::

## 前提知識

- **重なるコピー**: コピー元とコピー先の領域が一部重なるコピーです。書く順番を誤ると、まだ読んでいない値を上書きします。
- **後方向（backwards）**: 末尾から先頭へ向かう向きです。後ろにずれる重なりに対応します。
- **`@setRuntimeSafety(false)`**: この関数の中で、実行時の安全チェックを切る指定です。
- **`assert`**: 前提を確かめる関数です。ここでは、コピー先の長さがコピー元以上であることを確かめます。
- **`while` と `i -= 1`**: `i` を減らしながら回すので、末尾から順に処理できます。

## 何をしているか

### 1. 前提を確かめる

```zig:line-numbers=250
    @setRuntimeSafety(false);
    assert(dest.len >= source.len);
```

安全チェックを切る前に、コピー先の長さが十分であることを `assert` で確かめます。

### 2. 末尾から順に代入する

```zig:line-numbers=252
    var i = source.len;
    while (i > 0) {
        i -= 1;
        dest[i] = source[i];
    }
```

`i` を末尾から 1 ずつ減らし、`dest[i] = source[i]` で代入します。後ろの要素から書くので、まだ読まれていない前の値を壊しません。

## ここがすごい

- **向きで重なりを解決**: 同じ重なりを、前からのコピーでは壊すところを、後ろからにすることで正しく扱えます。
- **安全チェックの扱い**: ループの中の安全チェックを切っていますが、事前の `assert` で長さを確かめています。
- **TODO が設計の課題を示す**: 注釈には、コンパイラがこの種のループを自動で扱うべきだという課題が書かれています。
- **`copyForwards` と対**: 向きの違う 2 つのコピー関数で、重なりの種類に応じて選べます。

## まとめ

- `copyBackwards` は、末尾から書いて、後ろにずれる重なりを正しくコピーします。
- 事前の `assert` で長さを確かめ、ループ内の安全チェックを切っています。
- 前からの `copyForwards` と組にして使い分けます。
