---
title: sysctl で実行ファイルのパスを得る
description: FreeBSD と DragonFly BSD の current_exe。sysctl に長さを先に聞き、そのサイズで値を受け取り、末尾の NUL を外して PathBuf にする。
language: rust
project: Rust 標準ライブラリ
repo: https://github.com/rust-lang/rust
license: MIT OR Apache-2.0
copyright: Copyright (c) The Rust Project Contributors
commit: "349bba62f1838cbd9b453ffda272c6972754122d"
file: library/std/src/sys/paths/unix.rs
lines: [171, 206]
function: current_exe
difficulty: 2
format: 2
tags: [移植性, 入出力, 防御的プログラミング]
---

## ひとことで

`current_exe` は、いま動いているプログラムの実行ファイルのパスを返す関数です。この版は FreeBSD と DragonFly BSD 向けです。これらの OS では、カーネルの `sysctl` という仕組みに直接問い合わせて、パスを取り出します。

`sysctl` は、OS の設定や状態を名前（ここでは番号の並び）で読み書きする仕組みです。この関数は、同じ問い合わせを 2 回行います。1 回目で必要な長さを聞き、2 回目で実際の値を受け取ります。

## コード

::: code-group

```rust:line-numbers=171 [日本語訳]
pub fn current_exe() -> io::Result<PathBuf> {
    unsafe {
        let mut mib = [
            libc::CTL_KERN as c_int,
            libc::KERN_PROC as c_int,
            libc::KERN_PROC_PATHNAME as c_int,
            -1 as c_int,
        ];
        let mut sz = 0;
        cvt(libc::sysctl(
            mib.as_mut_ptr(),
            mib.len() as libc::c_uint,
            ptr::null_mut(),
            &mut sz,
            ptr::null_mut(),
            0,
        ))?;
        if sz == 0 {
            return Err(io::Error::last_os_error());
        }
        let mut v: Vec<u8> = Vec::with_capacity(sz);
        cvt(libc::sysctl(
            mib.as_mut_ptr(),
            mib.len() as libc::c_uint,
            v.as_mut_ptr() as *mut libc::c_void,
            &mut sz,
            ptr::null_mut(),
            0,
        ))?;
        if sz == 0 {
            return Err(io::Error::last_os_error());
        }
        v.set_len(sz - 1); // 末尾の NUL 文字を切り落とす
        Ok(PathBuf::from(OsString::from_vec(v)))
    }
}
```

```rust:line-numbers=171 [原文]
pub fn current_exe() -> io::Result<PathBuf> {
    unsafe {
        let mut mib = [
            libc::CTL_KERN as c_int,
            libc::KERN_PROC as c_int,
            libc::KERN_PROC_PATHNAME as c_int,
            -1 as c_int,
        ];
        let mut sz = 0;
        cvt(libc::sysctl(
            mib.as_mut_ptr(),
            mib.len() as libc::c_uint,
            ptr::null_mut(),
            &mut sz,
            ptr::null_mut(),
            0,
        ))?;
        if sz == 0 {
            return Err(io::Error::last_os_error());
        }
        let mut v: Vec<u8> = Vec::with_capacity(sz);
        cvt(libc::sysctl(
            mib.as_mut_ptr(),
            mib.len() as libc::c_uint,
            v.as_mut_ptr() as *mut libc::c_void,
            &mut sz,
            ptr::null_mut(),
            0,
        ))?;
        if sz == 0 {
            return Err(io::Error::last_os_error());
        }
        v.set_len(sz - 1); // chop off trailing NUL
        Ok(PathBuf::from(OsString::from_vec(v)))
    }
}
```

:::

## 前提知識

- **`sysctl`**: OS のカーネルが持つ設定や情報を読み書きする仕組みです。Unix 系の OS で使われます。
- **MIB（管理情報ベース）の配列**: `sysctl` で項目を指定する番号の並びです。`[CTL_KERN, KERN_PROC, KERN_PROC_PATHNAME, -1]` は、「カーネルのプロセス情報のうち、実行ファイルのパス」を指し、`-1` は現在のプロセスを表す指定です。
- **`unsafe` ブロック**: コンパイラが安全性を保証できない操作を書く場所です。C の関数を呼ぶ `libc::sysctl` は、ここに置かれます。
- **`cvt`**: C の関数の戻り値（失敗を表す -1 など）を `io::Result` に変える補助関数です。
- **`Vec::with_capacity` と `set_len`**: 容量だけを先に確保して、中身を後から書き込む方法です。`set_len` で長さを確定させます。

## 何をしているか

### 1. 必要なバッファの長さを聞く

```rust:line-numbers=179
        let mut sz = 0;
        cvt(libc::sysctl(
            mib.as_mut_ptr(),
            mib.len() as libc::c_uint,
            ptr::null_mut(),
            &mut sz,
            ptr::null_mut(),
            0,
        ))?;
        if sz == 0 {
            return Err(io::Error::last_os_error());
        }
```

`sz` を 0 にして、最初の `sysctl` を呼びます。出力先のポインタは null なので、値は返されず、必要な長さだけが `sz` に入ります。長さが 0 なら、OS のエラーを返します。

### 2. 容量を確保して値を受け取る

```rust:line-numbers=191
        let mut v: Vec<u8> = Vec::with_capacity(sz);
        cvt(libc::sysctl(
            mib.as_mut_ptr(),
            mib.len() as libc::c_uint,
            v.as_mut_ptr() as *mut libc::c_void,
            &mut sz,
            ptr::null_mut(),
            0,
        ))?;
        if sz == 0 {
            return Err(io::Error::last_os_error());
        }
```

`Vec` を `sz` の容量で作り、その先頭のポインタを `sysctl` に渡します。取得した値は `v` の中に直接書き込まれ、`sz` には実際の長さが入ります。ここでも、長さが 0 でないことを確かめます。

### 3. 末尾の NUL を取り除いて `PathBuf` にする

```rust:line-numbers=203
        v.set_len(sz - 1); // chop off trailing NUL
        Ok(PathBuf::from(OsString::from_vec(v)))
```

OS が返すパスは、末尾に NUL 文字（0 のバイト）が付いています。`set_len(sz - 1)` で、その 1 バイトを長さから外します。最後に、バイト列を `OsString` を経由して `PathBuf` にします。`PathBuf` は、OS のパスを表す型です。

## ここがすごい

- **長さの二段階取得**: 必要な大きさがわからないときに、先に長さだけを聞いてからバッファを作るので、無駄に大きな領域を取らずに済みます。
- **ポインタに直接書かせる**: `Vec` の容量を確保してから、その先頭を C の関数に渡すので、値をコピーし直す必要がありません。
- **毎回エラーを確認する**: 呼び出しのたびに `cvt` と `sz == 0` の確認をしているので、途中で失敗しても不正な値を使わずに済みます。
- **OS ごとの実装を cfg で分ける**: 同じ名前の関数が OS ごとに別の実装を持ち、呼ぶ側は OS の違いを意識しなくてすみます。

## まとめ

- 必要なサイズがわからないときは、長さを先に聞いてから値を受け取ると安全です。
- C の関数とやり取りするときは、戻り値と長さの両方を確認します。
- OS ごとの実装は cfg で切り分け、同じ名前の関数で呼べるようにします。
