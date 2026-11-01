---
title: アドレスのハッシュで 32 個のミューテックスに振り分ける、shared_ptr のアトミック操作
description: std::atomic_load(shared_ptr*) などが使う __get_sp_mut。オブジェクトごとにロックを持たせず、アドレスをハッシュして固定個数のミューテックスから 1 つを選ぶ「ロックストライピング」。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/src/memory.cpp
lines: [104, 132]
function: std::__get_sp_mut
difficulty: 2
format: 2
tags: [並行処理, ハッシュ, 設計パターン]
---
## ひとことで

`__get_sp_mut(p)` は、ポインタ `p` に対応する **ミューテックス**（同時に 1 つのスレッドしか入れないようにする鍵）を返す関数です。
C++11 からある `std::atomic_load(const shared_ptr<T>*)` などの関数が、`shared_ptr` 変数を安全に読み書きするために使います。
ミューテックスは全体で **たった 32 個** しかなく、アドレスのハッシュで振り分けます。

## コード

```cpp:line-numbers=104
static constexpr std::size_t __sp_mut_count                = 32;
static constinit __libcpp_mutex_t mut_back[__sp_mut_count] = {
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER};

constexpr __sp_mut::__sp_mut(void* p) noexcept : __lx_(p) {}

void __sp_mut::lock() noexcept {
  auto m = static_cast<__libcpp_mutex_t*>(__lx_);
  __libcpp_mutex_lock(m);
}

void __sp_mut::unlock() noexcept { __libcpp_mutex_unlock(static_cast<__libcpp_mutex_t*>(__lx_)); }

__sp_mut& __get_sp_mut(const void* p) {
  static constinit __sp_mut muts[__sp_mut_count] = {
      &mut_back[0],  &mut_back[1],  &mut_back[2],  &mut_back[3],  &mut_back[4],  &mut_back[5],  &mut_back[6],
      &mut_back[7],  &mut_back[8],  &mut_back[9],  &mut_back[10], &mut_back[11], &mut_back[12], &mut_back[13],
      &mut_back[14], &mut_back[15], &mut_back[16], &mut_back[17], &mut_back[18], &mut_back[19], &mut_back[20],
      &mut_back[21], &mut_back[22], &mut_back[23], &mut_back[24], &mut_back[25], &mut_back[26], &mut_back[27],
      &mut_back[28], &mut_back[29], &mut_back[30], &mut_back[31]};
  return muts[hash<const void*>()(p) & (__sp_mut_count - 1)];
}
```

## 前提知識

- **ミューテックス（mutex）**: 排他制御の鍵です。`lock()` した スレッドが `unlock()` するまで、ほかのスレッドは `lock()` で待たされます。
- **`static constexpr`**: ファイル内だけで使う、コンパイル時に決まる定数です。
- **`constinit`**: 「この変数はプログラムの開始前に（コンパイル時に）初期化される」ことを保証する指定です。ほかのグローバル変数の初期化順序に左右されません。
- **`_LIBCPP_MUTEX_INITIALIZER`**: ミューテックスの初期値を表すマクロです。POSIX なら `PTHREAD_MUTEX_INITIALIZER` にあたります。
- **関数内の `static` 変数**: 関数の中で宣言した `static` 変数は、プログラム全体で 1 つだけ存在し、呼び出しをまたいで生き続けます。
- **`static_cast<__libcpp_mutex_t*>(__lx_)`**: `void*`（型のわからないポインタ）を、ミューテックスへのポインタに変換しています。ヘッダに OS 固有の型を出さないため、`__sp_mut` は `void*` だけを持っています。
- **`hash<const void*>()(p)`**: 標準ライブラリのハッシュ関数でポインタをハッシュします。
- **`& (__sp_mut_count - 1)`**: 個数が 2 のべき乗（32）なので、32 で割った余りをビット AND で求めています。

## 何をしているか

### 1. ミューテックスの本体を 32 個並べる

```cpp:line-numbers=104
static constexpr std::size_t __sp_mut_count                = 32;
static constinit __libcpp_mutex_t mut_back[__sp_mut_count] = {
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER,
    _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER, _LIBCPP_MUTEX_INITIALIZER};
```

`mut_back` は、OS のミューテックスを 32 個並べた配列です。すべて静的に初期化されます。

### 2. 薄い包み

```cpp:line-numbers=115
constexpr __sp_mut::__sp_mut(void* p) noexcept : __lx_(p) {}

void __sp_mut::lock() noexcept {
  auto m = static_cast<__libcpp_mutex_t*>(__lx_);
  __libcpp_mutex_lock(m);
}

void __sp_mut::unlock() noexcept { __libcpp_mutex_unlock(static_cast<__libcpp_mutex_t*>(__lx_)); }
```

`__sp_mut` は、`void*` で OS のミューテックスを指すだけの小さなクラスです。`lock()` と `unlock()` は、それぞれ OS の関数を呼ぶだけです。

### 3. アドレスから 1 つを選ぶ

```cpp:line-numbers=124
__sp_mut& __get_sp_mut(const void* p) {
  static constinit __sp_mut muts[__sp_mut_count] = {
      &mut_back[0],  &mut_back[1],  &mut_back[2],  &mut_back[3],  &mut_back[4],  &mut_back[5],  &mut_back[6],
      &mut_back[7],  &mut_back[8],  &mut_back[9],  &mut_back[10], &mut_back[11], &mut_back[12], &mut_back[13],
      &mut_back[14], &mut_back[15], &mut_back[16], &mut_back[17], &mut_back[18], &mut_back[19], &mut_back[20],
      &mut_back[21], &mut_back[22], &mut_back[23], &mut_back[24], &mut_back[25], &mut_back[26], &mut_back[27],
      &mut_back[28], &mut_back[29], &mut_back[30], &mut_back[31]};
  return muts[hash<const void*>()(p) & (__sp_mut_count - 1)];
}
```

`muts` は 32 個の `__sp_mut` で、`mut_back` の各要素を指しています。
`p` をハッシュし、下位 5 ビット（0〜31）を取り出して、その番号の `__sp_mut` を返します。

ヘッダ側（`shared_ptr.h`）の `atomic_load` は、次のように使っています。

```cpp
__sp_mut& __m = std::__get_sp_mut(__p);
__m.lock();
shared_ptr<_Tp> __q = *__p;
__m.unlock();
```

同じ `shared_ptr` 変数のアドレスからは、必ず同じミューテックスが選ばれます。だから同じ変数への操作は互いに排他されます。

## ここがすごい

素直に考えると「`shared_ptr` 1 つにつき 1 つのミューテックス」を持たせたくなります。しかし `shared_ptr` の大きさは規格や ABI（バイナリの互換性）で事実上決まっていて、あとからミューテックスを追加できません。しかもアトミック操作をほとんど使わない大多数の `shared_ptr` にとっては無駄な領域になります。

そこで、**固定個数のロックを、アドレスのハッシュで共有する** という方法をとっています。これはロックストライピングと呼ばれる手法です。異なる変数が同じロックに当たることもありますが、それは「たまに余計に待つ」だけで、正しさは損なわれません。

アドレスをそのまま `% 32` しないで、いったんハッシュしているのにも意味があります。ポインタは 8 や 16 の倍数に整列していることが多く、下位ビットが 0 に偏りがちです。そのまま下位 5 ビットを使うと、ほんの数個のロックに集中してしまいます。ハッシュでビットを混ぜることで、32 個に散らばりやすくなります。

`constinit` で静的に初期化しているので、ほかのグローバル変数のコンストラクタから `atomic_load` が呼ばれても、ミューテックスが未初期化ということはありません。

## まとめ

- オブジェクトごとにロックを持てないときは、固定個数のロックをハッシュで共有する（ロックストライピング）。
- 同じアドレスからは必ず同じロックが選ばれるので、正しさは保たれる。
- ポインタの下位ビットは偏るので、そのまま使わずハッシュで混ぜる。
- 個数を 2 のべき乗にすると、余りの計算をビット AND で済ませられる。
- `constinit` で、グローバル変数の初期化順序の問題を避けられる。
