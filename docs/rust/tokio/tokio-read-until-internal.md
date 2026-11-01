---
title: 区切り文字まで、バッファを読みながら集める
description: tokio の read_until の内部処理。バッファ内を memchr で区切り文字まで探し、見つかればそこまでを集めて終わり、なければ全部を集めて次の読み込みへ進む。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/io/util/read_until.rs
lines: [47, 75]
function: read_until_internal
difficulty: 2
format: 2
tags: [入出力, 非同期, 探索]
---

## ひとことで

`read_until_internal` は、非同期の読み取りで **指定した区切り文字（例えば改行）が現れるまで** データを集める関数です。`read_until` や `read_line` の中身として使われます。

読み取り元は、バッファ（一時的な領域）を持っています。この関数は、そのバッファの中を区切り文字で探し、見つかれば、そこまでを取り出して終わります。見つからなければ、バッファの全部を取り込んで、次のデータを待ちます。

## コード

```rust:line-numbers=47
pub(super) fn read_until_internal<R: AsyncBufRead + ?Sized>(
    mut reader: Pin<&mut R>,
    cx: &mut Context<'_>,
    delimiter: u8,
    buf: &mut Vec<u8>,
    read: &mut usize,
) -> Poll<io::Result<usize>> {
    loop {
        let (done, used) = {
            let available = match ready!(reader.as_mut().poll_fill_buf(cx)) {
                Ok(available) => available,
                Err(e) if e.kind() == io::ErrorKind::Interrupted => continue,
                Err(e) => return Poll::Ready(Err(e)),
            };
            if let Some(i) = memchr::memchr(delimiter, available) {
                buf.extend_from_slice(&available[..=i]);
                (true, i + 1)
            } else {
                buf.extend_from_slice(available);
                (false, available.len())
            }
        };
        reader.as_mut().consume(used);
        *read += used;
        if done || used == 0 {
            return Poll::Ready(Ok(mem::replace(read, 0)));
        }
    }
}
```

この関数は、`Poll` を返す非同期の処理です。データがまだ届いていなければ `Pending` を返し、届いたら再び呼ばれます。`read` は、この呼び出しで読んだ合計のバイト数を、呼び出し側へ渡すための累計です。

## 前提知識

- **`AsyncBufRead`**: バッファを持つ非同期の読み取り元です。`poll_fill_buf` でバッファの中身を見て、`consume` で読んだ分を消費します。
- **`memchr`**: バイト列の中から、指定したバイトの最初の位置を探す関数です。SIMD を使うので、とても速く動きます。
- **`Interrupted`**: 処理が割り込まれたことを表すエラーです。再試行すれば済むので、`continue` でループを続けます。
- **`consume`**: バッファから、読んだバイト数を取り除きます。次に読むデータが先頭にくるようにします。
- **`mem::replace`**: 値を入れ替えて、古い値を返します。ここでは、累計の読み取り量を 0 に戻して返します。

## 何をしているか

### 1. バッファの中身を取り出す

```rust:line-numbers=55
        let (done, used) = {
            let available = match ready!(reader.as_mut().poll_fill_buf(cx)) {
                Ok(available) => available,
                Err(e) if e.kind() == io::ErrorKind::Interrupted => continue,
                Err(e) => return Poll::Ready(Err(e)),
            };
```

`poll_fill_buf` で、バッファの中身を取ります。割り込みのエラーなら、やり直します。それ以外のエラーは、そのまま呼び出し側へ返します。

### 2. 区切り文字を探す

```rust:line-numbers=61
            if let Some(i) = memchr::memchr(delimiter, available) {
                buf.extend_from_slice(&available[..=i]);
                (true, i + 1)
            } else {
                buf.extend_from_slice(available);
                (false, available.len())
            }
```

`memchr` で、中身の中から区切り文字を探します。見つかれば、その位置までを `buf` に追加し、終わりのフラグを立てます。見つからなければ、中身の全部を追加し、続きが必要であることを示します。

### 3. 読んだ分を消費して、終わりを判断する

```rust:line-numbers=69
        reader.as_mut().consume(used);
        *read += used;
        if done || used == 0 {
            return Poll::Ready(Ok(mem::replace(read, 0)));
        }
```

読んだ分を `consume` で消費し、累計に足します。区切り文字が見つかったか、読むものがなくなった（`used == 0`）なら、累計を返して終わります。そうでなければ、ループして次のデータを待ちます。

## ここがすごい

- **余分に読まない**: 区切り文字の後ろのデータは、バッファに残したまま返します。次の読み取りが、そこから続けられます。
- **バッファ単位で探す**: 1 バイトずつ読む代わりに、バッファの中を `memchr` で一気に探します。
- **中断を自然に扱う**: `Interrupted` の場合は、呼び出し側に気づかせずに再試行します。

## まとめ

- 区切り文字をバッファの中で `memchr` により一気に探す。
- 見つかればそこまでを取り、なければ全部を取り込んで次を待つ。
- 読んだ分だけを `consume` で消費し、余分なデータは残す。
