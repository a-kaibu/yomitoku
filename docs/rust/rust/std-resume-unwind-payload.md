---
title: パニックを、表示せずに再開する
description: 標準ライブラリの resume_unwind。受け取った値をパニックの内容として持ち直し、パニックのフックを通さずに巻き戻しを再開する。多重のパニックは中止する。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/panicking.rs
lines: [842, 875]
function: resume_unwind
difficulty: 3
format: 2
tags: [エラー処理, 防御的プログラミング, 型システム]
---

## ひとことで

`resume_unwind` は、標準ライブラリで **すでに起きたパニックを、同じ中身のまま再開する** 関数です。利用者向けの `std::panic::resume_unwind` が、この内部の関数を呼びます。

通常のパニックでは、まずパニックのメッセージが表示され、その後に巻き戻しが始まります。しかし `resume_unwind` は、メッセージを表示せずに、受け取った値（ペイロード）をそのまま使って巻き戻しを行います。別のスレッドで捕まえたパニックを、呼び出し元に伝え直すような場面で使われます。

## コード

```rust:line-numbers=842
pub(crate) fn resume_unwind(payload: Box<dyn Any + Send>) -> ! {
    if let Some(must_abort) = panic_count::increase(false) {
        match must_abort {
            panic_count::MustAbort::PanicInHook => {
                rtprintpanic!("thread panicked while processing panic. aborting.\n");
            }
            panic_count::MustAbort::AlwaysAbort => {
                rtprintpanic!("aborting due to panic\n");
            }
        }

        crate::process::abort();
    }

    struct RewrapBox(Box<dyn Any + Send>);

    impl PanicPayload for RewrapBox {
        fn take_box(&mut self) -> Box<dyn Any + Send> {
            mem::replace(&mut self.0, Box::new(()))
        }

        fn get(&mut self) -> &(dyn Any + Send) {
            &*self.0
        }
    }

    impl fmt::Display for RewrapBox {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.write_str(payload_as_str(&self.0))
        }
    }

    rust_panic(&mut RewrapBox(payload))
}
```

## 前提知識

- **パニック**: Rust の回復不能なエラーです。パニックが起きると、関数を抜けながら値の後片付けをする「巻き戻し（unwind）」が始まります。
- **ペイロード**: パニックに付けて運ばれる値です。`Box<dyn Any + Send>` の形で、どんな型の値でも入れられます。
- **パニックのフック**: パニックが起きたときに、メッセージを表示するなどの処理を行う仕組みです。`resume_unwind` は、この処理を通しません。
- **`panic_count`**: パニックが進行中かどうかを数える仕組みです。すでにパニックの処理中であれば、多重のパニックとして扱います。
- **`Any`**: 型を実行時に確かめられるトレイトです。ペイロードが何の型かを、利用者が確かめるために使われます。

## 何をしているか

### 1. 多重のパニックなら中止する

```rust:line-numbers=843
    if let Some(must_abort) = panic_count::increase(false) {
        match must_abort {
            panic_count::MustAbort::PanicInHook => {
                rtprintpanic!("thread panicked while processing panic. aborting.\n");
            }
            panic_count::MustAbort::AlwaysAbort => {
                rtprintpanic!("aborting due to panic\n");
            }
        }

        crate::process::abort();
    }
```

`panic_count::increase` で、パニックの数を 1 増やします。すでにパニックの処理中（フックの中で起きたパニックなど）であれば、`must_abort` で理由を示し、メッセージを表示してからプロセスを中止します。

### 2. ペイロードを包む型を作る

```rust:line-numbers=856
    struct RewrapBox(Box<dyn Any + Send>);

    impl PanicPayload for RewrapBox {
        fn take_box(&mut self) -> Box<dyn Any + Send> {
            mem::replace(&mut self.0, Box::new(()))
        }

        fn get(&mut self) -> &(dyn Any + Send) {
            &*self.0
        }
    }
```

`RewrapBox` は、受け取った `Box` を内部に持つ型です。`take_box` は、中身を取り出して、代わりに `()` を入れます。`get` は、中身を参照として返します。この型は、`PanicPayload` という内部のトレイトを満たすために作られています。

### 3. 表示用の文字列を作る

```rust:line-numbers=868
    impl fmt::Display for RewrapBox {
        fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
            f.write_str(payload_as_str(&self.0))
        }
    }
```

`Display` の実装は、ペイロードを文字列として取り出して表示します。文字列でない値の場合の表示は、`payload_as_str` が決めます。

### 4. 巻き戻しを再開する

```rust:line-numbers=874
    rust_panic(&mut RewrapBox(payload))
```

`rust_panic` に、ペイロードを包んだ `RewrapBox` を渡して、パニックの巻き戻しを始めます。この段階では、フックは呼ばれません。

## ここがすごい

- **メッセージを二重に出さない**: 元のパニックで既にメッセージが出ているので、再開のときに同じメッセージを出しません。利用者の画面が見やすく保たれます。
- **値を所有権ごと渡す**: `Box` の所有権を `RewrapBox` に移すので、値の寿命は一貫して管理されます。`take_box` で、取り出しも安全に行えます。
- **多重パニックを防ぐ**: パニックの数を数えて、パニックの処理中の再パニックは中止します。無限に巻き戻しが続く事態を防ぎます。
- **型の消去と再取得**: `Any` の値を `Box` のまま運び、必要なときだけ型を確かめる設計になっています。どんな型の値でも同じ経路で伝えられます。

## まとめ

- 捕まえたパニックを伝え直すときは、表示の処理を重ねないように、フックを通さない経路を用意すると便利です。
- 所有する値は `Box` に包み、所有権ごと渡すと、寿命の管理が簡単になります。
- 多重の失敗は、回数を数えて早めに止めると、安全性が保たれます。
