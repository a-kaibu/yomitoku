---
title: 固定の大きさのバケットに入れ、いっぱいなら一番古い値を押し出す
description: Ghostty の CacheTable.put。ハッシュ値でバケットを選び、空きがあれば追加、満杯なら一番古い値を捨てて新しい値を入れる。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/cache_table.zig
lines: [81, 103]
function: CacheTable.put
difficulty: 3
format: 2
tags: [キャッシュ, ハッシュ, データ構造]
---

## ひとことで

`put` は、キャッシュ（一時的に値をためておく場所）にキーと値の組を入れる関数です。
キャッシュは、大きさが決まっていて、ハッシュ値に応じた「バケット」に値を分けて入れます。バケットがいっぱいなら、一番古い値を押し出して、その値を返します。

この関数は、押し出された値を呼び出し側に返すので、必要なら後始末もできます。

## コード

::: code-group

```zig:line-numbers=81 [日本語訳]
        pub fn put(self: *Self, key: K, value: V) ?KV {
            const kv: KV = .{ .key = key, .value = value };
            const idx: usize = @intCast(self.context.hash(key) % bucket_count);

            // バケットに空きがあれば、末尾に追加するだけ
            if (self.lengths[idx] < bucket_size) {
                self.buckets[idx][self.lengths[idx]] = kv;
                self.lengths[idx] += 1;
                return null;
            }
            assert(self.lengths[idx] == bucket_size);

            // 新しい値を追加して、一番古い値を返す
            const evicted = fastmem.rotateIn(KV, &self.buckets[idx], kv);

            // The Context is allowed to register an eviction hook.
            if (comptime @hasDecl(Context, "evicted")) self.context.evicted(
                evicted.key,
                evicted.value,
            );

            return evicted;
        }
```

```zig:line-numbers=81 [原文]
        pub fn put(self: *Self, key: K, value: V) ?KV {
            const kv: KV = .{ .key = key, .value = value };
            const idx: usize = @intCast(self.context.hash(key) % bucket_count);

            // If we have space available in the bucket then we just append
            if (self.lengths[idx] < bucket_size) {
                self.buckets[idx][self.lengths[idx]] = kv;
                self.lengths[idx] += 1;
                return null;
            }
            assert(self.lengths[idx] == bucket_size);

            // Append our new item and return the oldest
            const evicted = fastmem.rotateIn(KV, &self.buckets[idx], kv);

            // The Context is allowed to register an eviction hook.
            if (comptime @hasDecl(Context, "evicted")) self.context.evicted(
                evicted.key,
                evicted.value,
            );

            return evicted;
        }
```

:::

## 前提知識

- **キャッシュ**: よく使う値を速く取り出せるように、一時的に保存しておく仕組みです。古い値は、容量が足りなくなると捨てられます。
- **ハッシュ値**: キーから作られる数値です。同じキーからは同じハッシュ値が出ます。
- **バケット**: 値を入れる小さな箱のことです。ハッシュ値を `bucket_count` で割った余りで、どの箱に入るかを決めます。
- **`self.lengths[idx]`**: バケットに入っている値の数です。
- **`assert`**: 条件が成り立つことを確かめる文です。成り立たなければ、プログラムを止めます。
- **`fastmem.rotateIn`**: 配列の末尾に新しい値を入れ、先頭の値を取り出して返す補助関数です。配列の要素を 1 つずつずらします。
- **`@hasDecl`**: 型に、指定した名前の関数や定数があるかをコンパイル時に調べる組み込み関数です。

## 何をしているか

### 1. キーからバケットを選ぶ

```zig:line-numbers=82
            const kv: KV = .{ .key = key, .value = value };
            const idx: usize = @intCast(self.context.hash(key) % bucket_count);
```

キーと値を 1 組にまとめます。次に、キーのハッシュ値を `bucket_count` で割った余りを、バケットの番号 `idx` にします。同じキーは、いつも同じバケットに入ります。

### 2. 空きがあれば、末尾に追加する

```zig:line-numbers=86
            if (self.lengths[idx] < bucket_size) {
                self.buckets[idx][self.lengths[idx]] = kv;
                self.lengths[idx] += 1;
                return null;
            }
```

バケットに空きがあるときは、末尾に値を書き、個数を 1 増やします。押し出された値はないので、`null` を返します。

### 3. 満杯なら、一番古い値を押し出す

::: code-group

```zig:line-numbers=91 [日本語訳]
            assert(self.lengths[idx] == bucket_size);

            // 新しい値を追加して、一番古い値を返す
            const evicted = fastmem.rotateIn(KV, &self.buckets[idx], kv);
```

```zig:line-numbers=91 [原文]
            assert(self.lengths[idx] == bucket_size);

            // Append our new item and return the oldest
            const evicted = fastmem.rotateIn(KV, &self.buckets[idx], kv);
```

:::

ここまで来ると、バケットは満杯です。`rotateIn` は、新しい `kv` を末尾に入れて、先頭の一番古い値を返します。この古い値を `evicted` に受け取ります。

### 4. 押し出された値に、後始末の機会を与える

::: code-group

```zig:line-numbers=96 [日本語訳]
            // Context は、押し出し時の処理（evicted）を登録できる。
            if (comptime @hasDecl(Context, "evicted")) self.context.evicted(
                evicted.key,
                evicted.value,
            );

            return evicted;
```

```zig:line-numbers=96 [原文]
            // The Context is allowed to register an eviction hook.
            if (comptime @hasDecl(Context, "evicted")) self.context.evicted(
                evicted.key,
                evicted.value,
            );

            return evicted;
```

:::

`Context` に `evicted` という関数があれば、押し出された値を、その関数へ渡します。たとえば、メモリの解放や、ログの記録をここで行えます。`@hasDecl` はコンパイル時に判定するので、無い場合は呼び出しのコードが作られません。

最後に、押し出された値を返します。

## ここがすごい

- **バケットで検索を速くする**: 全体を探さず、ハッシュ値から入る箱を 1 つに決めます。探すのは 1 つの箱の中だけです。
- **満杯でも失敗しない**: 容量を超えた値は、一番古い値を押し出して入れるので、`put` が失敗することはありません。キャッシュとしての役目が続きます。
- **後始末を型で選ぶ**: `@hasDecl` で、押し出し時の処理を持つ型だけ、その処理が入ります。使わない型のために、余計な処理は生成されません。
- **押し出された値を返す**: 呼び出し側が、古い値を受け取って使えます。捨てる値を黙って消さない設計です。

## まとめ

- キャッシュは、ハッシュ値で入れる箱（バケット）を決め、探す範囲を小さくします。
- 空きがあれば追加し、満杯なら一番古い値を押し出して新しい値を入れます。
- 押し出された値は呼び出し側に返すので、解放などの後始末に使えます。
- `@hasDecl` によって、必要な型にだけ後始末の処理が組み込まれます。
