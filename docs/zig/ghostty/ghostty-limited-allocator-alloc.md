---
title: 上限を超えるメモリの確保を、確保する前に断る
description: Ghostty の LimitedAllocator。元のアロケータに、使ってよいメモリの上限を付ける。上限を超える要求は、確保せずに失敗させ、超過した事実を記録する。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/limited_allocator.zig
lines: [34, 49]
function: LimitedAllocator.alloc
difficulty: 2
format: 2
tags: [メモリ管理, 防御的プログラミング]
---

## ひとことで

`LimitedAllocator` は、別のアロケータ（メモリを確保する仕組み）の前に立って、確保できる量に **上限** を付ける仕組みです。
ここに示す `alloc` は、その中心の関数です。要求された大きさが上限以内なら、元のアロケータに確保を頼みます。上限を超えていれば、確保せずに `null` を返します。

メモリを使いすぎないように、事前に決めた量を守らせたい場面で使われます。

## コード

```zig:line-numbers=34
    fn check(self: *LimitedAllocator, size: usize) bool {
        if (size <= self.limit) return true;
        self.limit_exceeded = true;
        return false;
    }

    fn alloc(
        ctx: *anyopaque,
        len: usize,
        alignment: std.mem.Alignment,
        ret_addr: usize,
    ) ?[*]u8 {
        const self: *LimitedAllocator = @ptrCast(@alignCast(ctx));
        if (!self.check(len)) return null;
        return self.child.rawAlloc(len, alignment, ret_addr);
    }
```
## 前提知識

- **アロケータ（allocator）**: メモリを確保したり、解放したりする仕組みです。Zig では、`Allocator` という型の値として、いろいろな実装を入れ替えて使えます。
- **`?[*]u8`**: 確保に失敗したら `null` を返す、メモリの先頭へのポインタです。
- **`*anyopaque`**: 型を隠したポインタです。アロケータの共通の窓口で、どんな型の値も指せます。
- **`@ptrCast(@alignCast(ctx))`**: `ctx` を、元の `LimitedAllocator` のポインタに戻す変換です。
- **`limit_exceeded`**: 上限を超えたことがあったかを記録するフラグです。
- **`child.rawAlloc`**: 元のアロケータに、生のメモリの確保を頼む関数です。

## 何をしているか

### 1. 上限と比べる

```zig:line-numbers=34
    fn check(self: *LimitedAllocator, size: usize) bool {
        if (size <= self.limit) return true;
        self.limit_exceeded = true;
        return false;
    }
```

`check` は、要求された大きさ `size` が上限 `limit` 以下かを確かめます。以下なら `true` を返します。超えていれば、超過したことを `limit_exceeded` に記録して、`false` を返します。

記録を残すのは、呼び出し側が後で「上限を超えたか」を確かめられるようにするためです。

### 2. 呼び出しの入口で、ポインタを戻す

```zig:line-numbers=46
        const self: *LimitedAllocator = @ptrCast(@alignCast(ctx));
```

アロケータの窓口は、型を隠した `ctx` を受け取ります。ここで、本来の `LimitedAllocator` の型に戻します。

### 3. 上限内なら、元のアロケータに頼む

```zig:line-numbers=47
        if (!self.check(len)) return null;
        return self.child.rawAlloc(len, alignment, ret_addr);
```

上限を超えていれば、そのまま `null` を返して終わります。元のアロケータは呼びません。
上限内なら、`child.rawAlloc` で、元のアロケータに確保を頼みます。確保したメモリのポインタを、そのまま返します。

## ここがすごい

- **確保する前に断る**: 上限を超えてから慌てて解放する方法ではなく、要求の段階で止めます。無駄なメモリを一度も使いません。
- **元のアロケータを変えない**: 上限の仕組みは、外から包むだけです。元の確保の仕組みは、そのままの動きで使われます。
- **超過を記録する**: `limit_exceeded` で、上限を超えたかどうかを後から調べられます。失敗が、ただのエラーで済まされません。
- **型を隠しても安全に戻す**: `ctx` を元の型に戻す処理で、型の整列（アライメント）も確かめています。

## まとめ

- アロケータに上限を付けるには、要求の大きさを比べてから、元のアロケータに頼みます。
- 上限を超えた要求は、確保せずに `null` を返します。
- 超過の記録を残すと、後から原因を調べられます。
- 元の確保の仕組みを変えずに、外側から制限を加えられます。
