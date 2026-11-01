---
title: 未知の長さのファイルを、少しずつ読み切る
description: 標準ライブラリの std_detect が Linux でファイルを読む read_file。libc で開き、4096 バイトずつ空き領域を確保して読み、0 が返るまで続け、エラーはメッセージにして返す。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std_detect/src/detect/os/linux/mod.rs
lines: [7, 36]
function: read_file
difficulty: 2
format: 2
tags: [入出力, エラー処理, 移植性]
---

## ひとことで

`read_file` は、標準ライブラリの `std_detect`（実行中の CPU の機能を調べる仕組み）が、Linux でファイルの中身を全部読むための関数です。たとえば `/proc` の下にある情報を読みます。ファイルの大きさは分からないので、少しずつ読み足していきます。

標準ライブラリの内部で使われるため、`std::fs` は使わず、`libc` の関数を直接呼んでいます。読めたバイト列を `Vec<u8>` として返し、失敗したときは理由を表す文字列を返します。

## コード

```rust:line-numbers=7
fn read_file(orig_path: &str) -> Result<Vec<u8>, alloc::string::String> {
    use alloc::format;

    let mut path = Vec::from(orig_path.as_bytes());
    path.push(0);

    unsafe {
        let file = libc::open(path.as_ptr() as *const libc::c_char, libc::O_RDONLY);
        if file == -1 {
            return Err(format!("Cannot open file at {orig_path}"));
        }

        let mut data = Vec::new();
        loop {
            data.reserve(4096);
            let spare = data.spare_capacity_mut();
            match libc::read(file, spare.as_mut_ptr() as *mut _, spare.len()) {
                -1 => {
                    libc::close(file);
                    return Err(format!("Error while reading from file at {orig_path}"));
                }
                0 => break,
                n => data.set_len(data.len() + n as usize),
            }
        }

        libc::close(file);
        Ok(data)
    }
}
```

## 前提知識

- **`libc`**: C の標準ライブラリの関数を Rust から呼ぶための crate です。`open`、`read`、`close` などを直接呼べます。
- **ファイル記述子**: `open` が返す、開いたファイルを指す番号です。`read` と `close` に渡して使います。
- **`O_RDONLY`**: ファイルを読み取り専用で開くことを表す指定です。
- **`Vec::reserve` と `spare_capacity_mut`**: 容量を確保し、まだ中身のない領域（余った容量）を取り出す操作です。読み込みの結果を直接そこへ書き込めます。
- **`set_len`**: `Vec` の長さを、実際に書き込んだ分だけ伸ばす操作です。書き込まれていない領域は含めません。

## 何をしているか

### 1. パスを C の文字列にして開く

```rust:line-numbers=10
    let mut path = Vec::from(orig_path.as_bytes());
    path.push(0);

    unsafe {
        let file = libc::open(path.as_ptr() as *const libc::c_char, libc::O_RDONLY);
        if file == -1 {
            return Err(format!("Cannot open file at {orig_path}"));
        }
```

パスの末尾に `0` を付けて、C の文字列の形にします。`open` で読み取り専用に開き、失敗（`-1`）なら、どのファイルかを示したエラー文字列を返します。

### 2. 空き領域を確保して読む

```rust:line-numbers=19
        let mut data = Vec::new();
        loop {
            data.reserve(4096);
            let spare = data.spare_capacity_mut();
            match libc::read(file, spare.as_mut_ptr() as *mut _, spare.len()) {
```

ファイルの大きさは分からないので、4096 バイトずつ空き領域を確保します。その余った領域を `spare` として取り出し、`read` で直接書き込ませます。

### 3. 結果で場合分けする

```rust:line-numbers=24
                -1 => {
                    libc::close(file);
                    return Err(format!("Error while reading from file at {orig_path}"));
                }
                0 => break,
                n => data.set_len(data.len() + n as usize),
```

`read` が `-1` なら、ファイルを閉じてから、読み取りのエラーを返します。`0` なら、ファイルの終わりなので、ループを抜けます。正の値なら、読んだ分だけ `set_len` で長さを伸ばします。

### 4. 閉じて返す

```rust:line-numbers=33
        libc::close(file);
        Ok(data)
```

読み終わったら、ファイルを閉じて、読んだ `Vec` を返します。

## ここがすごい

- **大きさを知らずに読み切る**: ファイルの大きさを調べる操作を省いても、0 が返るまで読み続けるので、どんな大きさでも正しく読めます。
- **書き込み先を直接渡す**: 一時的なバッファを作らず、`Vec` の余った領域へ直接読み込みます。コピーが減ります。
- **エラーの後始末を忘れない**: 失敗したときも、開いたファイルを閉じてから返します。ファイル記述子を取り残しません。
- **長さは実際に読んだ分だけ**: `set_len` を読んだ量だけに使うので、未初期化の部分を有効な値として扱うことがありません。

## まとめ

- 大きさの分からないデータは、0 が返るまで少しずつ読むのが基本の形です。
- 余った容量に直接書き込むと、一時的なコピーを減らせます。
- 失敗のときも開いた資源を閉じると、後始末の漏れを防げます。
