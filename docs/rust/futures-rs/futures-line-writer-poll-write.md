---
title: 改行まで書いてから、残りをバッファに溜める
description: futures の LineWriter の poll_write。書き込みデータの最後の改行までを先に出力し、後ろの続きだけをバッファに入れる。改行で区切られた行が途中で切れないようにする。
language: rust
project: futures-rs
repo: https://github.com/rust-lang/futures-rs
license: MIT OR Apache-2.0
copyright: Copyright (c) 2016 Alex Crichton, Copyright (c) 2017 The Tokio Authors
commit: "5bb0eb2f9e408a20d31e204a15b73014fa203e2c"
file: futures-util/src/io/line_writer.rs
lines: [62, 101]
function: LineWriter::poll_write
difficulty: 3
format: 2
tags: [入出力, 非同期, 防御的プログラミング]
---

## ひとことで

`poll_write` は、`LineWriter` に書き込まれたバイト列のうち、**最後の改行（`\n`）までを優先して出力する** 非同期の関数です。改行で終わる行が、途中で切れた状態で相手に届かないようにします。

改行より後ろの部分は、すぐに出さずにバッファへ溜めます。ただし、バッファの容量を超えないように、必要な分だけを扱います。

## コード

```rust:line-numbers=62
    fn poll_write(
        mut self: Pin<&mut Self>,
        cx: &mut Context<'_>,
        buf: &[u8],
    ) -> Poll<io::Result<usize>> {
        let mut this = self.as_mut().project();
        let newline_index = match memchr::memrchr(b'\n', buf) {
            None => {
                ready!(self.as_mut().flush_if_completed_line(cx)?);
                return self.project().buf_writer.poll_write(cx, buf);
            }
            Some(newline_index) => newline_index + 1,
        };

        ready!(this.buf_writer.as_mut().poll_flush(cx)?);

        let lines = &buf[..newline_index];

        let flushed = { ready!(this.buf_writer.as_mut().inner_poll_write(cx, lines))? };

        if flushed == 0 {
            return Poll::Ready(Ok(0));
        }

        let tail = if flushed >= newline_index {
            &buf[flushed..]
        } else if newline_index - flushed <= this.buf_writer.capacity() {
            &buf[flushed..newline_index]
        } else {
            let scan_area = &buf[flushed..];
            let scan_area = &scan_area[..this.buf_writer.capacity()];
            match memchr::memrchr(b'\n', scan_area) {
                Some(newline_index) => &scan_area[..newline_index + 1],
                None => scan_area,
            }
        };

        let buffered = this.buf_writer.as_mut().write_to_buf(tail);
        Poll::Ready(Ok(flushed + buffered))
    }
```

この関数は、`Poll` を返す非同期の書き込みです。書き込みの準備ができていなければ `Pending` を返し、呼び出し側が後で再び呼びます。`ready!` マクロは、`Pending` なら即座に戻る書き方です。

## 前提知識

- **`LineWriter`**: 内部に `BufWriter` を持ち、改行の単位で出力を整える書き込み器です。
- **`Poll`**: 非同期の処理がまだ終わっていないか、終わったかを表す型です。`Pending` なら後で再び呼ばれます。
- **`memrchr`**: バイト列の後ろから、指定したバイトを探す関数です。最後の改行の位置を求めるのに使います。
- **`ready!`**: `Poll::Pending` が返ったら、関数をそのまま抜けるマクロです。成功したら、中の値を取り出します。
- **バッファ（`BufWriter`）**: 小さな書き込みをまとめて、大きな書き込みにするための一時的な領域です。

## 何をしているか

### 1. 改行がなければ、そのまま書く

```rust:line-numbers=68
        let newline_index = match memchr::memrchr(b'\n', buf) {
            None => {
                ready!(self.as_mut().flush_if_completed_line(cx)?);
                return self.project().buf_writer.poll_write(cx, buf);
```

最後の改行が見つからなければ、行の途中のデータです。まず、完成した行がフラッシュされたかを確かめ、通常の `poll_write` に任せます。

### 2. 改行までの部分を先に出す

```rust:line-numbers=73
            Some(newline_index) => newline_index + 1,
        };

        ready!(this.buf_writer.as_mut().poll_flush(cx)?);

        let lines = &buf[..newline_index];

        let flushed = { ready!(this.buf_writer.as_mut().inner_poll_write(cx, lines))? };
```

最後の改行の位置より後ろは、いったん対象から外します。改行までの部分（`lines`）を、バッファを一度空にしてから書き出します。書き出せた量が `flushed` です。

### 3. 出せなかった残りを決める

```rust:line-numbers=86
        let tail = if flushed >= newline_index {
            &buf[flushed..]
        } else if newline_index - flushed <= this.buf_writer.capacity() {
            &buf[flushed..newline_index]
        } else {
            let scan_area = &buf[flushed..];
            let scan_area = &scan_area[..this.buf_writer.capacity()];
            match memchr::memrchr(b'\n', scan_area) {
                Some(newline_index) => &scan_area[..newline_index + 1],
                None => scan_area,
            }
        };
```

全部出せた場合は、残りは改行より後ろの部分です。途中までしか出せなかった場合は、残りの中で、バッファの容量の範囲に収まる部分だけを扱います。その中にも改行があれば、その位置までを、後でバッファに入れる分とします。

### 4. 残りをバッファに入れて、結果を返す

```rust:line-numbers=99
        let buffered = this.buf_writer.as_mut().write_to_buf(tail);
        Poll::Ready(Ok(flushed + buffered))
```

決めた部分をバッファに書き込み、書いた総量を返します。呼び出し側は、この量を元にして、次の書き込みを続けます。

## ここがすごい

- **行が途中で切れない**: 改行までを優先して出すので、行の途中で相手が読むのを防げます。
- **容量を超えない**: 残りを扱うときは、バッファの容量を上限にして切り出します。大きな入力でも、バッファを膨らませません。
- **状況ごとの分岐が明確**: 改行がない、全部出た、途中で止まった、の 3 つの状況を、順番に分けて処理しています。

## まとめ

- 最後の改行までを優先して出し、改行の後ろの続きだけをバッファへ溜める。
- 途中で止まったときも、バッファの容量の範囲に収めて切り出す。
- 非同期の `Poll` を `ready!` で扱い、準備ができていなければ即座に戻る。
