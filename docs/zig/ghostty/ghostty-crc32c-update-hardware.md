---
title: CPU の CRC 命令で、8 バイトずつデータの指紋を計算する
description: Ghostty の CRC32C 計算のうち、CPU の専用命令を使う updateHardware。8 バイト、4 バイト、1 バイトの順に読んで、速く検査値を求める。
language: zig
project: Ghostty
repo: https://github.com/ghostty-org/ghostty
license: MIT
copyright: Copyright (c) 2024 Mitchell Hashimoto, Ghostty contributors
commit: "a455842c28d587cd2ee2b75cc21fa021b1a47d09"
file: src/crc32c.zig
lines: [77, 98]
function: updateHardware
difficulty: 3
format: 2
tags: [ハッシュ, 最適化, 低レイヤ]
---

## ひとことで

`updateHardware` は、データの **CRC32C**（データが壊れていないかを確かめる検査値）を、CPU の専用命令で計算する関数です。
CRC は、ファイルの破損や通信の誤りを見つけるために使われます。データのバイトを順番に、CRC の命令へ流し込んでいきます。

ソフトウェアで 1 バイトずつ表を引く方法より、この関数のほうが桁違いに速くなります。コードのコメントにも、そのことが書かれています。

## コード

```zig:line-numbers=77
fn updateHardware(initial: u32, bytes: []const u8) u32 {
    var crc = initial;
    var remaining = bytes;

    while (remaining.len >= 8) : (remaining = remaining[8..]) {
        crc = step(u64, crc, std.mem.readInt(
            u64,
            remaining[0..8],
            .little,
        ));
    }
    if (remaining.len >= 4) {
        crc = step(u32, crc, std.mem.readInt(
            u32,
            remaining[0..4],
            .little,
        ));
        remaining = remaining[4..];
    }
    for (remaining) |byte| crc = step(u8, crc, byte);
    return crc;
}
```
## 前提知識

- **CRC（巡回冗長検査）**: データから短い検査値を作る方法です。データが 1 ビットでも変わると、検査値が変わるように作られています。
- **CRC32C**: CRC の一種で、32 ビットの値を作ります。iSCSI などで使われ、ハードウェアの命令が用意されています。
- **`u64` と `u32`**: 64 ビットと 32 ビットの符号なし整数です。CRC の計算を、大きい単位で行えます。
- **`std.mem.readInt(u64, bytes, .little)`**: バイト列の先頭から 8 バイトを、リトルエンディアン（小さい位のバイトが先頭にある並び）として読み込みます。
- **`remaining = remaining[8..]`**: スライスの先頭の 8 バイトを捨てて、残りを新しい `remaining` にします。
- **`inline fn step`**: 1 回の CRC 命令の呼び出しを包んだ関数です。`inline` は、呼び出す場所に展開されることを示します。

## 何をしているか

### 1. 8 バイトずつ、64 ビットの命令で処理する

```zig:line-numbers=81
    while (remaining.len >= 8) : (remaining = remaining[8..]) {
        crc = step(u64, crc, std.mem.readInt(
            u64,
            remaining[0..8],
            .little,
        ));
    }
```

残りが 8 バイト以上あるあいだ、先頭から 8 バイトを `u64` として読み込み、`step` で CRC に取り込みます。読んだあと、`remaining` を 8 バイト進めます。

8 バイトまとめて扱うのが、この関数の速さの大事な部分です。1 命令で 8 バイト分の処理が終わるので、ループの回数が 8 分の 1 に減ります。

### 2. 4 バイトが残っていれば、32 ビットで処理する

```zig:line-numbers=88
    if (remaining.len >= 4) {
        crc = step(u32, crc, std.mem.readInt(
            u32,
            remaining[0..4],
            .little,
        ));
        remaining = remaining[4..];
    }
```

8 の倍数で割り切れなかった場合、残りが 4 バイト以上なら、4 バイトだけ同じ方法で処理します。こうすると、残りを 1 バイトずつ扱う回数が減ります。

### 3. 残りの 1 バイトずつ処理する

```zig:line-numbers=96
    for (remaining) |byte| crc = step(u8, crc, byte);
    return crc;
```

最後に 3 バイト以下の端数が残ります。それらは 1 バイトずつ `step` に渡します。すべて処理し終わった `crc` を返します。

## ここがすごい

- **CPU の命令をそのまま使う**: x86 の SSE4.2 や ARM の CRC 拡張には、CRC32C 専用の命令があります。ソースの冒頭コメントによると、標準ライブラリの 1 バイトずつ表を引く方法より、桁違いに速いと説明されています。
- **大きい単位から、小さい単位へ**: 8 バイト、4 バイト、1 バイトの順に処理することで、読み込み回数を最小にしています。端数の扱いも、この順番で単純になります。
- **未整列のデータでも読める**: 入力の配列の先頭が 8 の倍数の位置にないことがあります。このコメントによれば、どちらの CPU も、未整列の読み込みを効率よく扱えます。
- **値は同じ**: どのバックエンド（実装の種類）でも、同じ結果になるように作られています。速い版と遅い版で、検査値が違うことはありません。

## まとめ

- CRC は、データが変わっていないかを確かめる検査値です。
- CPU の専用命令を使うと、ソフトウェアより桁違いに速く計算できます。
- 8 バイト、4 バイト、1 バイトの順に読むと、ループの回数を減らせます。
- 速さを上げても、結果は標準の CRC32C と一致するように作られています。
