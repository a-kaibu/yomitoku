---
title: 参照カウントを「所有者数 − 1」で持ち、0 ではなく -1 で破棄を判定する
description: shared_ptr の参照カウントを担う __shared_count。初期値 0 を「所有者 1 人」と解釈し、デクリメントの結果が -1 になったら破棄する。use_count は +1 して返す。
language: cpp
project: libc++（ユーティリティ・コンテナ）
repo: https://github.com/llvm/llvm-project
license: Apache-2.0 WITH LLVM-exception
copyright: Copyright (c) 2009-2019 by the contributors listed in CREDITS.TXT
commit: "384a71b8a2d99b5deb82792c23202c2b82b8ed82"
file: libcxx/include/__memory/shared_count.h
lines: [36, 79]
function: std::__shared_count
difficulty: 2
format: 2
tags: [メモリ管理, 並行処理, 設計パターン]
---
## ひとことで

`__shared_count` は、`std::shared_ptr` が「同じオブジェクトを何人が持っているか」を数えるための土台のクラスです。
最大の特徴は、カウントを **「所有者の数 − 1」** で保存していることです。所有者が 1 人なら 0、2 人なら 1 です。
最後の所有者がいなくなると値が -1 になり、そこでオブジェクトを破棄します。

## コード

```cpp:line-numbers=36
template <class _Tp>
inline _LIBCPP_HIDE_FROM_ABI _Tp __libcpp_atomic_refcount_decrement(_Tp& __t) _NOEXCEPT {
#if _LIBCPP_HAS_THREADS
  return __atomic_add_fetch(std::addressof(__t), -1, __ATOMIC_ACQ_REL);
#else
  return __t -= 1;
#endif
}

class _LIBCPP_EXPORTED_FROM_ABI __shared_count {
  __shared_count(const __shared_count&);
  __shared_count& operator=(const __shared_count&);

protected:
  long __shared_owners_;
  virtual ~__shared_count();

private:
  virtual void __on_zero_shared() _NOEXCEPT = 0;

public:
  _LIBCPP_HIDE_FROM_ABI explicit __shared_count(long __refs = 0) _NOEXCEPT : __shared_owners_(__refs) {}

#if defined(_LIBCPP_SHARED_PTR_DEFINE_LEGACY_INLINE_FUNCTIONS)
  void __add_shared() noexcept;
  bool __release_shared() noexcept;
#else
  _LIBCPP_HIDE_FROM_ABI void __add_shared() _NOEXCEPT { __libcpp_atomic_refcount_increment(__shared_owners_); }
  _LIBCPP_HIDE_FROM_ABI bool __release_shared() _NOEXCEPT {
    if (__libcpp_atomic_refcount_decrement(__shared_owners_) == -1) {
      __on_zero_shared();
      return true;
    }
    return false;
  }
#endif
  _LIBCPP_HIDE_FROM_ABI long use_count() const _NOEXCEPT {
#if _LIBCPP_HAS_THREADS
    return __atomic_load_n(&__shared_owners_, __ATOMIC_RELAXED) + 1;
#else
    return __shared_owners_ + 1;
#endif
  }
};
```

## 前提知識

- **`shared_ptr`**: 複数の場所から 1 つのオブジェクトを共有し、最後の持ち主がいなくなったら自動で削除するスマートポインタです。そのために「持ち主の数」（参照カウント）を管理しています。
- **`class` と `protected` / `private` / `public`**: クラスのメンバを、派生クラスにだけ見せる（`protected`）、自分だけ（`private`）、誰にでも（`public`）に分けます。
- **`virtual` と `= 0`**: `virtual` は派生クラスで中身を差し替えられる関数です。`= 0` は「ここでは中身を書かない、派生クラスで必ず書け」という純粋仮想関数です。`__on_zero_shared` は「所有者が 0 人になったら何をするか」を派生クラスに任せています。
- **コピーの禁止**: コピーコンストラクタと代入演算子を `private` に宣言だけして定義しないことで、コピーを禁止しています（C++11 以前からある書き方）。
- **`explicit`**: 引数 1 つのコンストラクタが、暗黙の型変換に使われないようにします。
- **アトミック操作**: 複数のスレッドが同時に同じ変数を書き換えても壊れないようにする、CPU の不可分な操作です。`__atomic_add_fetch(&t, 1, ...)` は「1 足して、足した後の値を返す」を一度に行います。
- **`#if _LIBCPP_HAS_THREADS`**: スレッドが使えない環境では、普通の足し算に切り替えています。

## 何をしているか

### 1. 増減の補助関数

```cpp:line-numbers=36
template <class _Tp>
inline _LIBCPP_HIDE_FROM_ABI _Tp __libcpp_atomic_refcount_decrement(_Tp& __t) _NOEXCEPT {
#if _LIBCPP_HAS_THREADS
  return __atomic_add_fetch(std::addressof(__t), -1, __ATOMIC_ACQ_REL);
#else
  return __t -= 1;
#endif
}
```

`__libcpp_atomic_refcount_decrement` は、アトミックに 1 を引いて **引いた後の値** を返します。増やす側（直前の行）は `__ATOMIC_RELAXED`、減らす側は `__ATOMIC_ACQ_REL` というメモリ順序を指定しています。

### 2. 初期値 0

```cpp:line-numbers=57
  _LIBCPP_HIDE_FROM_ABI explicit __shared_count(long __refs = 0) _NOEXCEPT : __shared_owners_(__refs) {}
```

`__shared_owners_` の初期値は 0 です。`shared_ptr` を 1 つ作った直後、所有者は 1 人です。つまり「保存値 = 所有者数 − 1」です。

### 3. 所有者が増える・減る

```cpp:line-numbers=63
  _LIBCPP_HIDE_FROM_ABI void __add_shared() _NOEXCEPT { __libcpp_atomic_refcount_increment(__shared_owners_); }
  _LIBCPP_HIDE_FROM_ABI bool __release_shared() _NOEXCEPT {
    if (__libcpp_atomic_refcount_decrement(__shared_owners_) == -1) {
      __on_zero_shared();
      return true;
    }
    return false;
  }
```

所有者 2 人の状態から追います。

```
保存値 1（所有者 2 人）
  release → 1 - 1 = 0   → -1 ではないので false
保存値 0（所有者 1 人）
  release → 0 - 1 = -1  → __on_zero_shared() を呼んで true
```

-1 になった瞬間が「最後の所有者がいなくなった」瞬間です。

### 4. 人数を返すとき

```cpp:line-numbers=72
  _LIBCPP_HIDE_FROM_ABI long use_count() const _NOEXCEPT {
#if _LIBCPP_HAS_THREADS
    return __atomic_load_n(&__shared_owners_, __ATOMIC_RELAXED) + 1;
#else
    return __shared_owners_ + 1;
#endif
  }
```

`use_count()` は保存値に 1 を足して返します。外から見える値は、ふつうの「所有者数」です。

## ここがすごい

素直に「所有者数」を保存すると、初期値を 1 にし、0 になったら破棄、という形になります。

この実装はそれを 1 ずらしています。こうすると **初期値が 0** になります。0 で初期化されたメモリは、多くの環境で特別な処理なしに用意できます。コンストラクタの既定引数も `__refs = 0` で済みます。

`__shared_weak_count`（同じファイルでこのクラスの直後に定義）は、`weak_ptr`（所有はしないが、オブジェクトがまだ生きているか確かめられるポインタ）の数も同じ「− 1」方式で持っています。`memory.cpp` の `lock()` は「保存値が -1 でなければ +1 する」という形で、オブジェクトがすでに破棄済みかを判定します。-1 という番兵値が、「0 人になった」という状態をはっきり表しているのです。

メモリ順序の使い分けも見どころです。増やすときは、すでに誰かが所有しているので、ほかの操作との順序を気にする必要がなく、最も軽い `RELAXED` で足ります。減らすときは、最後の 1 人がオブジェクトを破棄する前に、ほかのスレッドがそのオブジェクトに対して行った書き込みがすべて見えている必要があるので、`ACQ_REL` を使います。

## まとめ

- 参照カウントを「人数 − 1」で持つと、初期値を 0 にでき、-1 を「もういない」という番兵にできる。
- 外に見せる値（`use_count`）と内部の保存値は、変換して返せばよい。
- 破棄のタイミングを派生クラスに任せたいときは、純粋仮想関数が使える。
- アトミックな参照カウントでは、増やすときは軽い順序、減らすときは強い順序を使うのが定石。
