---
title: 8 バイトずつ読んで、残りを小さく分けて混ぜる
description: FxHasher の write。バイト列を usize の幅で切りながら混ぜ、余った 4 バイト、2 バイト、1 バイトを順に混ぜる。読む幅を大きくして、呼び出しの数を減らす。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/proc_macro/src/bridge/fxhash.rs
lines: [43, 62]
function: FxHasher::write
difficulty: 3
format: 2
tags: [ハッシュ, 最適化, ビット演算]
---

## ひとことで

`write` は、`FxHasher` に **バイトの列を渡して、ハッシュの状態を更新する** メソッドです。`Hash` トレイトを使う型は、最終的にこの関数でバイトを流し込まれます。
この関数は、バイト列を **ポインタの幅（64 ビットなら 8 バイト）** ずつ読んで混ぜます。残ったバイトは、4 バイト、2 バイト、1 バイトの順に小さく切って混ぜます。こうすると、1 バイトずつ混ぜるよりずっと速くなります。

## コード

```rust:line-numbers=43
    #[inline]
    fn write(&mut self, mut bytes: &[u8]) {
        let mut hash = FxHasher { hash: self.hash };
        assert!(size_of::<usize>() <= 8);
        while bytes.len() >= size_of::<usize>() {
            hash.add_to_hash(usize::from_ne_bytes(bytes[..size_of::<usize>()].try_into().unwrap()));
            bytes = &bytes[size_of::<usize>()..];
        }
        if (size_of::<usize>() > 4) && (bytes.len() >= 4) {
            hash.add_to_hash(u32::from_ne_bytes(bytes[..4].try_into().unwrap()) as usize);
            bytes = &bytes[4..];
        }
        if (size_of::<usize>() > 2) && bytes.len() >= 2 {
            hash.add_to_hash(u16::from_ne_bytes(bytes[..2].try_into().unwrap()) as usize);
            bytes = &bytes[2..];
        }
        if (size_of::<usize>() > 1) && !bytes.is_empty() {
            hash.add_to_hash(bytes[0] as usize);
        }
        self.hash = hash.hash;
```

`hash` という作業用のコピーに混ぜてから、最後に `self.hash` に書き戻しています。途中で関数が終わっても、中途半端な状態が残らないようにするための書き方です。

## 前提知識

- **`Hasher` トレイト**: ハッシュ値を計算するための操作を決めたトレイトです。`write` は、バイトの列を受け取る基本の操作です。
- **`size_of::<usize>()`**: `usize` のバイト数です。64 ビット環境では 8、32 ビット環境では 4 です。
- **`from_ne_bytes`**: バイトの列を、その環境のバイトの並び（ネイティブの順序）で整数にします。
- **スライスの分割**: `bytes[..n]` で先頭 n バイトを、`bytes[n..]` で残りを取り出せます。
- **`try_into().unwrap()`**: スライスを固定長の配列に変換します。長さが合わなければパニックします。

## 何をしているか

### 1. 幅いっぱいのかたまりを順に混ぜる

```rust:line-numbers=47
        while bytes.len() >= size_of::<usize>() {
            hash.add_to_hash(usize::from_ne_bytes(bytes[..size_of::<usize>()].try_into().unwrap()));
            bytes = &bytes[size_of::<usize>()..];
        }
```

残りのバイト数が `usize` の幅以上ある間、先頭の幅だけを整数として読み、`add_to_hash` で混ぜます。読んだ分だけ、`bytes` の先頭を進めます。
64 ビット環境では、8 バイトずつ混ぜることになります。

### 2. 余りを 4 バイト、2 バイト、1 バイトの順に混ぜる

```rust:line-numbers=51
        if (size_of::<usize>() > 4) && (bytes.len() >= 4) {
            hash.add_to_hash(u32::from_ne_bytes(bytes[..4].try_into().unwrap()) as usize);
            bytes = &bytes[4..];
        }
```

`usize` が 4 バイトより大きい環境では、残りが 4 バイト以上あれば、4 バイト分を混ぜます。次に 2 バイト、最後に 1 バイトを同じように混ぜます。
`if (size_of::<usize>() > 4)` のような条件は、コンパイル時の定数です。32 ビット環境では、この分岐は実行されません。

### 3. 作業用のコピーを書き戻す

```rust:line-numbers=62
        self.hash = hash.hash;
```

すべてのかたまりを混ぜ終えたら、作業用の `hash` の値を `self.hash` に書き戻します。

## ここがすごい

- **読む幅を広げて呼び出しを減らす**: 1 バイトずつ混ぜると、長い文字列では何万回も `add_to_hash` を呼ぶことになります。8 バイト単位で読めば、回数は 8 分の 1 です。
- **余りを小さく分けて、すべてのバイトを使う**: 4、2、1 の順に分けると、残りがどんな長さでも全部混ぜられます。
- **条件はコンパイル時に決まる**: `size_of` を使った条件は、ビルド時にどちらかに決まります。実行時には比べる処理がなく、無駄がありません。
- **作業用のコピーで一貫性を保つ**: 途中まで混ぜた状態を別の変数で持ち、最後にまとめて書き戻すので、読み手が状態の変化を追いやすくなります。
- **安全性の前提を明示**: `assert!(size_of::<usize>() <= 8)` で、想定しない環境で動かないようにしています。

## まとめ

- バイト列は、`usize` の幅で読んで混ぜ、余りを 4、2、1 バイトの順に混ぜる。
- 大きな単位で読むことで、呼び出し回数が減り、速くなる。
- 条件の多くはコンパイル時に決まるので、実行時の負担が小さい。
