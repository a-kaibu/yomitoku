---
title: 容量が十分だと分かっている円形バッファに、値を素早く書き込む
description: Ghostty の CircBuf.appendAssumeCapacity。満杯でないことを assert で確かめてから、値を書いて位置を進める。エラーの経路を省いた、速い版の追加。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/datastruct/circ_buf.zig
lines: [87, 93]
function: CircBuf.appendAssumeCapacity
difficulty: 2
format: 2
tags: [データ構造, 最適化, 防御的プログラミング]
---

## ひとことで

`appendAssumeCapacity` は、円形バッファに値を追加する速い版です。呼び出し側が容量を確かめていることを前提にして、エラーの経路を省いています。前提が破れていれば、`assert` で止まります。

## コード

```zig:line-numbers=87
        pub fn appendAssumeCapacity(self: *Self, v: T) void {
            assert(!self.full);
            self.storage[self.head] = v;
            self.head += 1;
            if (self.head >= self.storage.len) self.head = 0;
            self.full = self.head == self.tail;
        }
```

## 前提知識

- **容量（capacity）**: バッファに入る最大の数です。ここでは配列の大きさです。
- **`assume`**: 「〜と仮定する」という意味です。関数の名前が、容量の確認を省くことを表します。
- **`assert`**: 前提の条件を確かめる関数です。違えば、デバッグや安全チェックで止まります。
- **`append` との違い**: `append` は満杯のときエラーを返します。この関数は、満杯でないことを前提にします。
- **折り返し**: 配列の末尾を越えたら、先頭へ戻すことです。

## 何をしているか

### 1. 満杯でないことを確かめる

```zig:line-numbers=88
            assert(!self.full);
```

`assert(!self.full)` で、満杯でないことを前提として確かめます。満杯なら、ここで止まります。

### 2. 値を書いて位置を進める

```zig:line-numbers=89
            self.storage[self.head] = v;
            self.head += 1;
            if (self.head >= self.storage.len) self.head = 0;
```

`head` の位置に値を入れ、`head` を進めます。末尾を越えたら 0 に戻します。

### 3. 満杯の印を更新する

```zig:line-numbers=92
            self.full = self.head == self.tail;
```

書いた後で、`head` と `tail` が一致したら、満杯の印を立てます。

## ここがすごい

- **エラーの分岐がない**: 満杯の判定を `assert` に任せるので、通常の経路は直線的です。速く動きます。
- **前提を明示**: 関数の名前と `assert` で、呼び出し側の責任がはっきりしています。
- **`append` と対**: 安全な版と速い版を、同じ処理の形で揃えています。用途で使い分けられます。
- **原因を早く見つける**: 前提が破れたときに、すぐ止まるので、バグの発見が早くなります。

## まとめ

- `appendAssumeCapacity` は、満杯でないことを前提に、値を速く追加します。
- `assert` で前提を確かめ、破れたら止まります。
- 容量を確かめてから使う場面で、`append` の代わりになります。
