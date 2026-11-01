---
title: 読んだ分だけを切り出して、バッファの容量を再利用する
description: tokio-util の ReaderStream。読み取り元から BytesMut に読み、読めた部分だけを split で切り出して Bytes にする。残りの容量は次の読み取りに使われる。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio-util/src/io/reader_stream.rs
lines: [93, 122]
function: ReaderStream::poll_next
difficulty: 3
format: 2
tags: [入出力, 非同期, メモリ管理]
---

## ひとことで

`poll_next` は、読み取り元（`AsyncRead`）からデータを少しずつ取り出して、**チャンク（かたまり）の列** として返す関数です。`ReaderStream` というストリームの 1 回分の処理にあたります。

データは `BytesMut`（書き換え可能なバイト列）に読み込みます。読めた部分だけを `split` で切り出して、読み取り専用の `Bytes` にします。切り出した後も、バッファの残りの容量はそのまま次の読み取りに使えます。

## コード

```rust:line-numbers=93
    fn poll_next(mut self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Option<Self::Item>> {
        use crate::util::poll_read_buf;

        let mut this = self.as_mut().project();

        let reader = match this.reader.as_pin_mut() {
            Some(r) => r,
            None => return Poll::Ready(None),
        };

        if this.buf.capacity() == 0 {
            this.buf.reserve(*this.capacity);
        }

        match poll_read_buf(reader, cx, &mut this.buf) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(Err(err)) => {
                self.project().reader.set(None);
                Poll::Ready(Some(Err(err)))
            }
            Poll::Ready(Ok(0)) => {
                self.project().reader.set(None);
                Poll::Ready(None)
            }
            Poll::Ready(Ok(_)) => {
                let chunk = this.buf.split();
                Poll::Ready(Some(Ok(chunk.freeze())))
            }
        }
    }
```

この関数は、`Stream` トレイトの `poll_next` を実装しています。読み取り元が終わったら `None` を返し、ストリームも終わりになります。

## 前提知識

- **ストリーム（`Stream`）**: 非同期に、値を 1 つずつ取り出せる列です。`poll_next` で次の値を求めます。
- **`BytesMut` と `Bytes`**: `BytesMut` は、後ろに書き足したり、先頭を切り出したりできるバッファです。`Bytes` は、同じメモリを共有する読み取り専用の型です。
- **`split`**: `BytesMut` の、今までに書き込まれた部分を切り出します。切り出した後の残りの領域は、そのまま `BytesMut` に残ります。
- **`freeze`**: `BytesMut` を `Bytes` に変えます。コピーせずに、同じメモリを使えます。
- **`Pin` と `project`**: 非同期の構造体の中の、動かせないフィールドに安全にアクセスするための仕組みです。

## 何をしているか

### 1. 読み取り元がなければ終わる

```rust:line-numbers=96
        let mut this = self.as_mut().project();

        let reader = match this.reader.as_pin_mut() {
            Some(r) => r,
            None => return Poll::Ready(None),
        };
```

読み取り元は `Option` で持たれています。すでに終わっていれば、`None` を返してストリームを終えます。

### 2. バッファの容量を確保する

```rust:line-numbers=103
        if this.buf.capacity() == 0 {
            this.buf.reserve(*this.capacity);
        }
```

バッファの容量が 0 なら、指定された容量を確保します。一度確保すれば、以降の読み取りで再利用できます。

### 3. 読み取り結果に応じて分ける

```rust:line-numbers=107
        match poll_read_buf(reader, cx, &mut this.buf) {
            Poll::Pending => Poll::Pending,
            Poll::Ready(Err(err)) => {
                self.project().reader.set(None);
                Poll::Ready(Some(Err(err)))
            }
```

読み取りが待ちなら `Pending` を返します。エラーなら、読み取り元を取り外し、エラーを 1 回返します。

```rust:line-numbers=113
            Poll::Ready(Ok(0)) => {
                self.project().reader.set(None);
                Poll::Ready(None)
            }
```

0 バイトを読んだら、データの終わりです。読み取り元を取り外して、ストリームも終えます。

```rust:line-numbers=117
            Poll::Ready(Ok(_)) => {
                let chunk = this.buf.split();
                Poll::Ready(Some(Ok(chunk.freeze())))
            }
```

データが読めたら、`split` で読めた部分を切り出し、`freeze` で `Bytes` にして返します。残りの容量は、`buf` に残ります。

## ここがすごい

- **コピーなし**: 切り出した `Bytes` は、読み込んだメモリをそのまま指します。データを別の場所へ移す必要がありません。
- **容量を使い回す**: `split` の後も、確保したバッファの残りは次の読み取りに使えます。読み取りのたびに、大きなメモリを確保し直しません。
- **終わりを一度だけ処理する**: エラーや終わりのときは、読み取り元を `None` にします。終わった後に読み取り元へ触れないよう、状態を保っています。

## まとめ

- 読み取った分だけを `split` で切り出し、`freeze` で読み取り専用にして返す。
- 切り出した後の残りの容量を、次の読み取りに使い回す。
- 終わりやエラーのときは読み取り元を外し、状態を守る。
