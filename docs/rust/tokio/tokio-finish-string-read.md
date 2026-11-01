---
title: 途中で失敗した文字列の読み込みを後始末する
description: tokio の read_line が使う後始末関数。I/O エラーと UTF-8 変換エラーの組み合わせごとに、出力用の String に残す内容を決める。
language: rust
project: Tokio
repo: https://github.com/tokio-rs/tokio
license: MIT
copyright: Copyright (c) Tokio Contributors
commit: "b499257ef62bd631b83a988d371f4330f545670c"
file: tokio/src/io/util/read_line.rs
lines: [56, 90]
function: finish_string_read
difficulty: 2
format: 2
tags: [非同期, エラー処理, 文字列処理]
---

## ひとことで

`finish_string_read` は、`read_line` や `read_to_string` などの非同期の文字列読み込みが、最後に行う後始末の関数です。読み込み中の I/O エラーと、UTF-8 として正しくないというエラーの組み合わせに応じて、出力用の `String` にどこまでを残すかを決めます。

読み込んだデータは、最初はバイト列のまま集められます。そのバイト列を `String` に変換できたかどうかと、I/O が成功したかどうかで、4 通りの場合に分かれます。この関数は、`match` の 4 つの腕でそれぞれの場合を処理します。

## コード

```rust:line-numbers=56
pub(super) fn finish_string_read(
    io_res: io::Result<usize>,
    utf8_res: Result<String, FromUtf8Error>,
    read: usize,
    output: &mut String,
    truncate_on_io_error: bool,
) -> Poll<io::Result<usize>> {
    match (io_res, utf8_res) {
        (Ok(num_bytes), Ok(string)) => {
            debug_assert_eq!(read, 0);
            *output = string;
            Poll::Ready(Ok(num_bytes))
        }
        (Err(io_err), Ok(string)) => {
            *output = string;
            if truncate_on_io_error {
                let original_len = output.len() - read;
                output.truncate(original_len);
            }
            Poll::Ready(Err(io_err))
        }
        (Ok(num_bytes), Err(utf8_err)) => {
            debug_assert_eq!(read, 0);
            let utf8_error = utf8_err.utf8_error();
            put_back_original_data(output, utf8_err.into_bytes(), num_bytes);

            Poll::Ready(Err(io::Error::new(io::ErrorKind::InvalidData, utf8_error)))
        }
        (Err(io_err), Err(utf8_err)) => {
            put_back_original_data(output, utf8_err.into_bytes(), read);

            Poll::Ready(Err(io_err))
        }
    }
}
```

## 前提知識

- **`io::Result<usize>`**: 読み込みが成功したときは読んだバイト数、失敗したときはエラーを返す型です。
- **`String` と `Vec<u8>`**: `String` は UTF-8 の文字列です。`Vec<u8>` は任意のバイト列なので、UTF-8 として正しくないデータも入れられます。
- **`FromUtf8Error`**: バイト列を UTF-8 の文字列に変換できなかったときのエラーです。`into_bytes` で、元のバイト列を取り出せます。
- **`Poll`**: 非同期処理がまだ終わっていない（`Pending`）か、終わった（`Ready`）かを表す型です。
- **`truncate`**: `String` や `Vec` の末尾を切り落として、長さを縮める操作です。

## 何をしているか

### 1. どちらも成功した場合

```rust:line-numbers=63
    match (io_res, utf8_res) {
        (Ok(num_bytes), Ok(string)) => {
            debug_assert_eq!(read, 0);
            *output = string;
            Poll::Ready(Ok(num_bytes))
        }
```

I/O も UTF-8 への変換も成功したときは、変換済みの文字列を `output` に入れ、読んだバイト数を返します。`debug_assert_eq!` は、デバッグビルドでだけ働く確認です。ここでは `read` が 0 であることを確かめています。

### 2. I/O エラーだけが起きた場合

```rust:line-numbers=69
        (Err(io_err), Ok(string)) => {
            *output = string;
            if truncate_on_io_error {
                let original_len = output.len() - read;
                output.truncate(original_len);
            }
            Poll::Ready(Err(io_err))
        }
```

途中まで読めた文字列は `output` に入れておきます。`truncate_on_io_error` が真のときだけ、今回追加された分を切り落とします。`read_line` と `read_to_string` は、エラー時の扱いが違うので、呼び出し側がこの引数で切り替えられるようにしています。

### 3. UTF-8 の変換だけが失敗した場合

```rust:line-numbers=77
        (Ok(num_bytes), Err(utf8_err)) => {
            debug_assert_eq!(read, 0);
            let utf8_error = utf8_err.utf8_error();
            put_back_original_data(output, utf8_err.into_bytes(), num_bytes);

            Poll::Ready(Err(io::Error::new(io::ErrorKind::InvalidData, utf8_error)))
        }
```

読んだバイト列を元の状態に戻し、`InvalidData` のエラーを返します。元に戻す処理は、次の `put_back_original_data` が行います。

```rust:line-numbers=46
fn put_back_original_data(output: &mut String, mut vector: Vec<u8>, num_bytes_read: usize) {
    let original_len = vector.len() - num_bytes_read;
    vector.truncate(original_len);
    *output = String::from_utf8(vector).expect("The original data must be valid utf-8.");
}
```

この関数は、今回読んだ分を末尾から切り落としてから、`String` に作り直します。作り直す前のバイト列は、もともと有効な UTF-8 だったので、`expect` で確かめています。

### 4. 両方とも失敗した場合

```rust:line-numbers=84
        (Err(io_err), Err(utf8_err)) => {
            put_back_original_data(output, utf8_err.into_bytes(), read);

            Poll::Ready(Err(io_err))
        }
```

I/O のエラーと UTF-8 のエラーが同時に起きたときは、I/O エラーを優先して返します。UTF-8 の失敗は、元の状態へ戻すためだけに使います。

## ここがすごい

- **失敗の種類ごとに残す範囲を決める**: 「データが壊れていたのか」「入出力が失敗したのか」で、`output` に残す内容を変えています。
- **先にバイト列で集める**: 文字列に変換する前の生のバイト列を持っているので、失敗したときに元の状態へ戻せます。
- **エラーの優先順位が明確**: 両方失敗したときは I/O エラーを返し、UTF-8 の失敗は内部の後始末に使うと決めています。
- **呼び出し側の違いを引数で吸収**: `truncate_on_io_error` で二つの API の違いを、1 つの関数にまとめています。

## まとめ

- 失敗が起きたときに、どこまでを残すかを明確に決めておくと、呼び出し側が混乱しません。
- 文字列に変換する前のバイト列を持っておくと、元に戻す処理が簡単になります。
- 4 通りの組み合わせを `match` で並べると、考え漏れを防げます。
