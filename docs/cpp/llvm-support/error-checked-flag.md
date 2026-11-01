---
title: 「エラーを確認したか」の印をポインタの最下位ビットに隠す
description: LLVM の Error は、確認されずに捨てられると異常終了する。その「確認済み」フラグを、追加のメモリを使わずポインタの最下位ビットに埋め込んでいる。
language: cpp
project: LLVM Support
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Part of the LLVM Project, under the Apache License v2.0 with LLVM Exceptions.
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: llvm/include/llvm/Support/Error.h
lines: [268, 311]
function: llvm::Error::setChecked
difficulty: 3
tags: [エラー処理, ビット演算, メモリ管理]
format: 2
---

## ひとことで

LLVM の `Error` 型は、関数の失敗を返すための型です。最大の特徴は、**中身を確認しないまま捨てると、デバッグビルドではプログラムが止まる**ことです。エラーの見落としを確実に見つけるための仕組みです。

そのためには「確認したかどうか」を覚えておく必要があります。`Error` はこの 1 ビットの情報を、**エラー情報を指すポインタの最下位ビット**にこっそり埋め込んでいます。`Error` の大きさはポインタ 1 個分のままです。

## コード

```cpp:line-numbers=268
  void assertIsChecked() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    if (LLVM_UNLIKELY(!getChecked() || getPtr()))
      fatalUncheckedError();
#endif
  }

  ErrorInfoBase *getPtr() const {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    return reinterpret_cast<ErrorInfoBase*>(
             reinterpret_cast<uintptr_t>(Payload) &
             ~static_cast<uintptr_t>(0x1));
#else
    return Payload;
#endif
  }

  void setPtr(ErrorInfoBase *EI) {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    Payload = reinterpret_cast<ErrorInfoBase*>(
                (reinterpret_cast<uintptr_t>(EI) &
                 ~static_cast<uintptr_t>(0x1)) |
                (reinterpret_cast<uintptr_t>(Payload) & 0x1));
#else
    Payload = EI;
#endif
  }

  bool getChecked() const {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    return (reinterpret_cast<uintptr_t>(Payload) & 0x1) == 0;
#else
    return true;
#endif
  }

  void setChecked(bool V) {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    Payload = reinterpret_cast<ErrorInfoBase*>(
                (reinterpret_cast<uintptr_t>(Payload) &
                  ~static_cast<uintptr_t>(0x1)) |
                  (V ? 0 : 1));
#endif
  }
```

## 前提知識

- **ポインタ**: メモリ上の住所を表す値です。ここでは `ErrorInfoBase *Payload` がエラーの詳細情報を指し、成功なら `nullptr`（どこも指さない）です。
- **`uintptr_t` と `reinterpret_cast`**: `uintptr_t` はポインタを入れられる大きさの整数型です。`reinterpret_cast` は「ビット列はそのままで型だけ読み替える」変換で、ポインタを整数にしたり、その逆をしたりできます。
- **アラインメントと下位ビット**: `ErrorInfoBase` のようなオブジェクトは、少なくとも 2 の倍数の住所に置かれます（実際はもっと大きな倍数）。そのため、ポインタの値の**最下位ビットは常に 0** です。空いているこのビットを別の情報に使う手法を「ポインタタグ付け」と呼びます。
- **`#if LLVM_ENABLE_ABI_BREAKING_CHECKS`**: ビルドの設定で、検査を有効にしたときだけ中のコードを残すプリプロセッサの分岐です。無効なら `#else` 側が使われます。
- **`LLVM_UNLIKELY`**: 「この条件はめったに真にならない」とコンパイラに伝えるマクロです。

## 何をしているか

`Payload` の最下位ビットを「**未確認なら 1、確認済みなら 0**」として使います。

### 1. フラグを読む

```cpp:line-numbers=296
  bool getChecked() const {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    return (reinterpret_cast<uintptr_t>(Payload) & 0x1) == 0;
#else
    return true;
#endif
  }
```

`Payload` を整数にして `& 0x1` で最下位ビットを取り出し、0 なら確認済みです。

### 2. フラグを書く

```cpp:line-numbers=304
  void setChecked(bool V) {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    Payload = reinterpret_cast<ErrorInfoBase*>(
                (reinterpret_cast<uintptr_t>(Payload) &
                  ~static_cast<uintptr_t>(0x1)) |
                  (V ? 0 : 1));
#endif
  }
```

`~0x1`（最下位だけ 0 のマスク）で住所の部分を残し、最下位に `V ? 0 : 1` を入れます。たとえば住所が `0x1000` で未確認にするなら、`Payload` のビット列は `0x1001` になります。

### 3. 本物のポインタを取り出す

```cpp:line-numbers=275
  ErrorInfoBase *getPtr() const {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    return reinterpret_cast<ErrorInfoBase*>(
             reinterpret_cast<uintptr_t>(Payload) &
             ~static_cast<uintptr_t>(0x1));
#else
    return Payload;
#endif
  }
```

使うときは、最下位ビットを `& ~0x1` で消してから、ポインタに戻します。`0x1001` → `0x1000` です。

### 4. ポインタを書き換えてもフラグは保つ

```cpp:line-numbers=285
  void setPtr(ErrorInfoBase *EI) {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    Payload = reinterpret_cast<ErrorInfoBase*>(
                (reinterpret_cast<uintptr_t>(EI) &
                 ~static_cast<uintptr_t>(0x1)) |
                (reinterpret_cast<uintptr_t>(Payload) & 0x1));
#else
    Payload = EI;
#endif
  }
```

新しいポインタ `EI` の住所部分と、今の `Payload` の最下位ビットを OR で合成します。

### 5. 確認していなければ止める

```cpp:line-numbers=268
  void assertIsChecked() {
#if LLVM_ENABLE_ABI_BREAKING_CHECKS
    if (LLVM_UNLIKELY(!getChecked() || getPtr()))
      fatalUncheckedError();
#endif
  }
```

`assertIsChecked` は「未確認」または「エラーが入ったまま」なら `fatalUncheckedError()` を呼んで止めます。同じクラスのデストラクタ（`Error` が消えるときに呼ばれる関数）がこれを呼びます。

```cpp:line-numbers=232
  ~Error() {
    assertIsChecked();
    delete getPtr();
  }
```

`Error` は、作られた時点では成功の値であっても「未確認」です（コンストラクタで `setChecked(false)` しています）。確認の操作は `operator bool` です。

```cpp:line-numbers=240
  explicit operator bool() {
    setChecked(getPtr() == nullptr);
    return getPtr() != nullptr;
  }
```

`if (Err)` と書いたとき、成功（`nullptr`）なら確認済みになります。失敗なら、中身を取り出す（`handleErrors` などで処理する）まで未確認のままです。

### 検査を切ったビルドでは（`#else` 側）

フラグの読み書きは何もせず、`getChecked` は常に `true` を返します。ポインタはそのまま使われるので、リリースビルドではオーバーヘッドがゼロです。

## ここがすごい

素直に書くなら、`bool Checked;` というメンバーを足せば済みます。しかしそうすると、

- 64 ビット環境では、`Error` の大きさが 8 バイトから 16 バイトに増えます（整列のための詰め物が入るため）。
- しかもそのサイズはビルド設定で変わってしまいます。

`Error` はあらゆる関数の戻り値に使われる型なので、小さく保つことには大きな意味があります。ポインタの空きビットを使えば、**検査を有効にしても無効にしても、`Error` はポインタ 1 個分**のままです。

ビット操作は `getPtr` / `setPtr` / `getChecked` / `setChecked` の 4 つの関数に閉じ込められていて、ほかのコードは普通のポインタとフラグを扱う感覚で書けます。危ない技を小さな場所に隔離しているのも良い設計です。

また `fatalUncheckedError` の宣言に付いたコメントによると、`fatalUncheckedError` はわざと別の場所に定義して、`assertIsChecked` が小さくインライン展開されやすいようにしています。

## まとめ

- アラインメントのおかげで、ポインタの下位ビットは空いていることが多い。そこに小さな情報を埋め込める。
- タグ付きポインタは、使う前に必ずタグを消してから参照する。
- 危ないビット操作は、少数のアクセサ関数に閉じ込める。
- 「確認しないと止まる」型にすると、エラーの見落としを確実に見つけられる。
