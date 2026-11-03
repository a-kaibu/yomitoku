---
title: ロックを取る前に文字列のハッシュを計算し、登録済みの文字列を探す
description: ZLS の StringPool.getString。共有の辞書から文字列を探す処理で、重いハッシュ計算をロックの外で済ませ、ロックの中は探すだけにする。
language: zig
project: ZLS
repo: https://github.com/zigtools/zls
license: MIT
copyright: Copyright (c) ZLS contributors
commit: "b3e65123f1bf455cea491ba7069bebd5f93e6839"
file: src/analyser/string_pool.zig
lines: [56, 72]
function: StringPool.getString
difficulty: 3
format: 2
tags: [並行処理, ハッシュ, キャッシュ]
---

## ひとことで

`getString` は、文字列プール（同じ文字列を 1 つだけ保存しておく仕組み）から、与えられた文字列の番号を探す関数です。登録されていなければ `null` を返します。
プールは複数の処理から同時に使われるので、探す間は **ロック**（ほかの処理を待たせる仕組み）で守っています。

この関数は、ハッシュ値の計算をロックの外で行い、ロックの中では探す作業だけを行います。ロックを持つ時間を短くするための工夫です。

## コード

::: code-group

```zig:line-numbers=56 [日本語訳]
        pub fn getString(pool: *Pool, io: std.Io, str: []const u8) ?String {
            assert(std.mem.findScalar(u8, str, 0) == null);

            // ロックを取得する前に、ハッシュ値を先に計算しておく
            const precomputed_key_hash = std.hash_map.hashString(str);

            pool.mutex.lockUncancelable(io);
            defer pool.mutex.unlock(io);

            const adapter: PrecomputedStringIndexAdapter = .{
                .bytes = &pool.bytes,
                .adapted_key = str,
                .precomputed_key_hash = precomputed_key_hash,
            };

            const index = pool.map.getKeyAdapted(str, adapter) orelse return null;
            return @fromBackingInt(index);
```

```zig:line-numbers=56 [原文]
        pub fn getString(pool: *Pool, io: std.Io, str: []const u8) ?String {
            assert(std.mem.findScalar(u8, str, 0) == null);

            // precompute the hash before acquiring the lock
            const precomputed_key_hash = std.hash_map.hashString(str);

            pool.mutex.lockUncancelable(io);
            defer pool.mutex.unlock(io);

            const adapter: PrecomputedStringIndexAdapter = .{
                .bytes = &pool.bytes,
                .adapted_key = str,
                .precomputed_key_hash = precomputed_key_hash,
            };

            const index = pool.map.getKeyAdapted(str, adapter) orelse return null;
            return @fromBackingInt(index);
```

:::
## 前提知識

- **文字列プール（string pool）**: 同じ文字列を何度も保存しないように、1 つだけ保存して、番号で扱う仕組みです。
- **ハッシュ値**: 文字列から作られる数値です。辞書の中の場所を、すばやく見つけるために使います。
- **ロック（mutex）**: 同時に 1 つの処理だけが中身を触れるようにする仕組みです。取ってから、`unlock` で返します。
- **`defer`**: 関数を抜けるときに、必ず実行される処理を書く文です。ここでは `unlock` を確実に呼ぶために使います。
- **`assert`**: 条件が成り立つかを確かめる文です。ここでは、文字列に終端の 0 バイトが含まれないことを確かめています。
- **`orelse return null`**: 値がないときに、その場で `null` を返す書き方です。

## 何をしているか

### 1. 文字列を検査し、ハッシュを先に計算する

```zig:line-numbers=57
            assert(std.mem.findScalar(u8, str, 0) == null);

            // precompute the hash before acquiring the lock
            const precomputed_key_hash = std.hash_map.hashString(str);
```

まず、文字列に 0 のバイトが入っていないかを確かめます。そのあと、ハッシュ値を計算します。この時点では、まだロックを取っていません。

ハッシュの計算は、文字列の長さに比例して時間がかかります。ロックを持たない間に終わらせておけば、ほかの処理を待たせる時間が減ります。

### 2. ロックを取り、後始末を予約する

```zig:line-numbers=62
            pool.mutex.lockUncancelable(io);
            defer pool.mutex.unlock(io);
```

ここで、プールのロックを取ります。`defer` によって、この関数を抜けるときに、必ずロックが返されます。途中で `return` しても、ロックが残ることはありません。

### 3. 事前に計算したハッシュを使って探す

```zig:line-numbers=65
            const adapter: PrecomputedStringIndexAdapter = .{
                .bytes = &pool.bytes,
                .adapted_key = str,
                .precomputed_key_hash = precomputed_key_hash,
            };

            const index = pool.map.getKeyAdapted(str, adapter) orelse return null;
            return @fromBackingInt(index);
```

`adapter` は、探す文字列とハッシュ値をまとめた値です。辞書の検索では、このハッシュ値をそのまま使うので、ハッシュの計算が二度行われません。

見つからなければ `null` を返します。見つかれば、その番号を `String` の型に変えて返します。

## ここがすごい

- **ロックの中を短く**: 重い計算をロックの外に出すことで、ほかの処理が待つ時間が減ります。複数の処理が同時に使う場面で、効きやすい工夫です。
- **ハッシュを 1 回だけ計算**: 計算したハッシュを、`adapter` に入れて検索に渡しています。同じ文字列に対して、ハッシュを何度も計算し直しません。
- **`defer` で解除漏れを防ぐ**: ロックの解除を、取得の直後に書いています。途中で処理が変わっても、解除を忘れません。
- **`assert` で前提を守る**: 0 のバイトを含む文字列は、内部の表現と衝突します。その場合は、プログラムの誤りとして止めます。

## まとめ

- 共有の辞書を探すときは、ロックの外でできる計算を先に済ませます。
- ロックは取得の直後に `defer` で解除を予約すると、解除の漏れを防げます。
- 計算したハッシュ値を検索に渡すと、同じ計算を繰り返さずに済みます。
- ロックを持つ時間が短いほど、複数の処理が効率よく動きます。
