---
title: 24 バイトの nonce を、12 バイトに縮めて ChaCha20 に渡す
description: XChaCha20 で、長い nonce（乱数の種のようなもの）から鍵と短い nonce を作り直す extend 関数。長い nonce を安全に使うための準備。
language: zig
project: Zig
repo: https://github.com/ziglang/zig
license: MIT
copyright: Copyright (c) Zig contributors
commit: "738d2be9d6b6ef3ff3559130c05159ef53336224"
file: lib/std/crypto/chacha20.zig
lines: [522, 530]
function: extend
difficulty: 3
format: 2
tags: [暗号, セキュリティ]
---

## ひとことで

`extend` は、暗号の鍵（32 バイト）と長い nonce（24 バイト）を受け取り、ChaCha20 がそのまま使える **新しい鍵と 12 バイトの nonce** を作る関数です。
XChaCha20 という暗号方式で、長い nonce を使うための準備をしています。

nonce は、同じ鍵で暗号化するたびに変える必要がある「使い捨ての値」です。長いほうが衝突しにくいので、ランダムに決めても安全です。

## コード

```zig:line-numbers=522
fn extend(key: [32]u8, nonce: [24]u8, comptime rounds_nb: usize) struct { key: [32]u8, nonce: [12]u8 } {
    var subnonce: [12]u8 = undefined;
    @memset(subnonce[0..4], 0);
    subnonce[4..].* = nonce[16..24].*;
    return .{
        .key = ChaChaImpl(rounds_nb).hchacha20(nonce[0..16].*, key),
        .nonce = subnonce,
    };
}
```
## 前提知識

- **鍵（key）**: 暗号化と復号に使う秘密の値です。ここでは 32 バイトです。
- **nonce**: 1 回の暗号化ごとに使う、同じ鍵に対して一度きりの値です。同じ鍵と nonce の組み合わせを 2 回使うと、暗号が破られる危険があります。
- **ChaCha20**: 鍵と nonce から、暗号化に使う大量の疑似乱数（鍵ストリーム）を作る暗号方式です。使う nonce は 12 バイトです。
- **HChaCha20**: ChaCha20 の内部の計算を使って、鍵と 16 バイトの入力から新しい 32 バイトの鍵を作る関数です。`hchacha20` として呼ばれています。
- **`struct { key: ..., nonce: ... }`**: 名前付きの値をまとめて返すための無名の構造体です。`.{ ... }` で値を作ります。
- **`@memset`**: 配列の一部を同じ値で埋める組み込み関数です。ここでは 0 で埋めます。
- **`subnonce[4..].* = nonce[16..24].*`**: 配列の一部に別の配列の一部をコピーする書き方です。

## 何をしているか

### 1. 新しい nonce の前半を 0 にする

```zig:line-numbers=523
    var subnonce: [12]u8 = undefined;
    @memset(subnonce[0..4], 0);
```

新しい nonce は 12 バイトです。前半の 4 バイトは 0 で埋めます。ここは、ChaCha20 の入力の形に合わせるための「空き」です。

### 2. 残りの 8 バイトを、元の nonce の末尾からもらう

```zig:line-numbers=525
    subnonce[4..].* = nonce[16..24].*;
```

元の 24 バイトの nonce のうち、末尾の 8 バイト（16 から 23 番目）を、新しい nonce の後ろ 8 バイトにコピーします。

### 3. 鍵の部分は、HChaCha20 で作り直す

```zig:line-numbers=527
        .key = ChaChaImpl(rounds_nb).hchacha20(nonce[0..16].*, key),
```

新しい鍵は、元の鍵と nonce の先頭 16 バイトを HChaCha20 に渡して作ります。元の鍵をそのまま使わず、nonce によって変わる鍵を作るので、同じ鍵でも nonce が違えば別の鍵ストリームになります。

### 4. 2 つを一緒に返す

```zig:line-numbers=526
    return .{
        .key = ChaChaImpl(rounds_nb).hchacha20(nonce[0..16].*, key),
        .nonce = subnonce,
    };
```

新しい鍵と新しい nonce を 1 つの構造体にまとめて返します。呼び出し側は、この 2 つを通常の ChaCha20 にそのまま渡せます。

たとえば、24 バイトの nonce の 0 から 15 番目は HChaCha20 の入力に、16 から 23 番目は新しい nonce の後半に使われます。24 バイトの情報が、「鍵」と「12 バイトの nonce」に分配される形です。

## ここがすごい

- **長い nonce を安全に使える**: 24 バイトの nonce は、ランダムに生成しても衝突の心配がほとんどありません。ChaCha20 の 12 バイトの nonce では、同じ鍵でランダムに使うと衝突のリスクが上がります。そこで、長い nonce を HChaCha20 で「鍵」に混ぜ込んでいます。
- **既存の仕組みを再利用**: 新しい暗号を作るのではなく、ChaCha20 の内部の計算（HChaCha20）を使って鍵を作り直します。実装する部分が少なく、検証されている仕組みをそのまま使えます。
- **呼び出し側が簡単**: 戻り値は普通の ChaCha20 の鍵と nonce の形なので、暗号化の部分は XChaCha20 と ChaCha20 で共通のコードを使えます。
- **nonce の前半の 0 埋め**: 空いた 4 バイトを 0 にすることで、入力の形が決まり、暗号の仕様どおりに動きます。

## まとめ

- XChaCha20 は、24 バイトの長い nonce を使うための方式です。
- HChaCha20 で、元の鍵と nonce の一部から新しい鍵を作ります。
- nonce の残りの 8 バイトに 4 バイトの 0 を足すと、ChaCha20 の 12 バイトの nonce になります。
- 長い nonce によって、乱数で nonce を決めても衝突の心配が小さくなります。
