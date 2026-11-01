---
title: 数バイトを、途中で止まっても続きから読む
description: tokio の read_u16 などの内部。必要な数バイトを、読み取りが待ちになっても蓄えておき、揃った時点でビッグエンディアンの整数として返す。マクロで型ごとに生成される。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/io/util/read_int.rs
lines: [48, 76]
function: poll（reader! マクロの Future 実装）
difficulty: 3
format: 2
tags: [入出力, 非同期, マクロ, メタプログラミング]
---

## ひとことで

`poll` は、`read_u16` や `read_i32` のような **整数の読み取り** の内部処理です。整数は、決まった数のバイトで表されています。その数のバイトが揃うまで、途中で読み取りが待ちになっても、読んだ分を覚えておき、続きから読みます。

この関数は、`macro_rules!` によって、型ごとに生成されています。16 ビット、32 ビットなど、バイト数と読み取り方の違いを、マクロの引数で差し替えます。

## コード

```rust:line-numbers=48
            fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
                let mut me = self.project();

                if *me.read == $bytes as u8 {
                    return Poll::Ready(Ok(Buf::$reader(&mut &me.buf[..])));
                }

                while *me.read < $bytes as u8 {
                    let mut buf = ReadBuf::new(&mut me.buf[*me.read as usize..]);

                    *me.read += match me.src.as_mut().poll_read(cx, &mut buf) {
                        Poll::Pending => return Poll::Pending,
                        Poll::Ready(Err(e)) if e.kind() == io::ErrorKind::Interrupted => continue,
                        Poll::Ready(Err(e)) => return Poll::Ready(Err(e.into())),
                        Poll::Ready(Ok(())) => {
                            let n = buf.filled().len();
                            if n == 0 {
                                return Poll::Ready(Err(UnexpectedEof.into()));
                            }

                            n as u8
                        }
                    };
                }

                let num = Buf::$reader(&mut &me.buf[..]);

                Poll::Ready(Ok(num))
            }
```

`$bytes` は、読むバイト数です。`$reader` は、`Buf` の中の対応する読み取り関数の名前です。この 2 つを差し替えるだけで、型ごとの処理が完成します。

## 前提知識

- **`ReadBuf`**: 読み取り先のバッファを、未入力の部分を含めて表す型です。`filled` で、今まで読めた部分の長さが分かります。
- **`Poll::Pending`**: データがまだ届いていないことを表します。後で再び呼ばれます。
- **`UnexpectedEof`**: 読み取り元が終わったのに、必要なバイト数が揃わないことを表すエラーです。
- **`macro_rules!`**: 同じ形の関数を、引数を変えて何度も生成する仕組みです。
- **ビッグエンディアン**: 整数のバイトを、大きい位から先に並べる表し方です。ネットワークでよく使われます。`Buf::get_u16` などがこの順序で読みます。

## 何をしているか

### 1. 揃っていれば、すぐに返す

```rust:line-numbers=51
                if *me.read == $bytes as u8 {
                    return Poll::Ready(Ok(Buf::$reader(&mut &me.buf[..])));
                }
```

すでに必要なバイト数（`$bytes`）が読めていれば、バッファから値を取り出して返します。

### 2. 足りない分を読む

```rust:line-numbers=55
                while *me.read < $bytes as u8 {
                    let mut buf = ReadBuf::new(&mut me.buf[*me.read as usize..]);

                    *me.read += match me.src.as_mut().poll_read(cx, &mut buf) {
                        Poll::Pending => return Poll::Pending,
                        Poll::Ready(Err(e)) if e.kind() == io::ErrorKind::Interrupted => continue,
                        Poll::Ready(Err(e)) => return Poll::Ready(Err(e.into())),
                        Poll::Ready(Ok(())) => {
                            let n = buf.filled().len();
                            if n == 0 {
                                return Poll::Ready(Err(UnexpectedEof.into()));
                            }

                            n as u8
                        }
                    };
                }
```

読めたバイト数 `read` が必要な数に届くまで、続きの位置から読み取ります。待ちなら `Pending` を返し、`read` の値は保たれます。割り込みなら、そのままやり直します。0 バイトなら、データの終わりとして `UnexpectedEof` を返します。

### 3. 揃った値を取り出す

```rust:line-numbers=73
                let num = Buf::$reader(&mut &me.buf[..]);

                Poll::Ready(Ok(num))
```

必要なバイトが揃ったら、`Buf` の読み取り関数で整数に変換して返します。

## ここがすごい

- **途中で止まっても失わない**: 読んだバイトは `buf` と `read` に覚えられています。次に呼ばれたとき、続きから読めます。
- **型の違いをマクロで吸収**: 16 ビット、32 ビット、符号の有無などの違いを、同じ形の関数で表しています。コードの重複が減ります。
- **終わりを正しく判定**: 途中でデータが尽きたときは、不完全な値を返さず、エラーにします。

## まとめ

- 必要なバイトが揃うまで、読んだ分を `read` に覚えておき、続きから読む。
- マクロで、バイト数と読み取り関数を差し替え、型ごとの処理を生成する。
- データが途中で終わったら、不完全な値ではなくエラーを返す。
