---
title: デストラクタを「呼ばせない」箱 NoDestructor
description: 関数内の static 変数を、プログラム終了時に破棄させないためのクラス。生のバイト配列に placement new で作り、デストラクタを持たない形にしている。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2023 The Abseil Authors.
file: absl/base/no_destructor.h
lines: [112, 181]
function: NoDestructor
difficulty: 3
tags: [メモリ管理, 設計パターン, イディオム]
---

## ひとことで

`absl::NoDestructor<T>` は、中に入れた `T` のオブジェクトの **デストラクタを決して呼ばない** 箱です。
`static absl::NoDestructor<std::string> s("foo");` のように関数内の `static` 変数に使うと、プログラムの終了時に `s` が破棄されません。

なぜそんなことをしたいのか、そしてどうやって「デストラクタを呼ばせない」のかを読んでいきます。

## コード

::: code-group

```cpp:line-numbers=112 [日本語訳]
template <typename T>
class NoDestructor {
 public:
  // 引数を T のコンストラクタに転送する: T(args...) を呼ぶ。
  template <typename... Ts,
            // コピー/ムーブと衝突しうるときは、このオーバーロードを無効にする。
            std::enable_if_t<!std::is_same_v<void(std::decay_t<Ts>&...),
                                             void(NoDestructor&)>,
                             int> = 0>
  explicit constexpr NoDestructor(Ts&&... args)
      : impl_(std::forward<Ts>(args)...) {}

  // T のコピー構築・ムーブ構築を転送する。次のような使い方ができる:
  // static NoDestructor<std::array<string, 3>> x{{{"1", "2", "3"}}};
  // static NoDestructor<std::vector<int>> x{{1, 2, 3}};
  explicit constexpr NoDestructor(const T& x) : impl_(x) {}
  explicit constexpr NoDestructor(T&& x)
      : impl_(std::move(x)) {}

  // コピーは禁止。
  NoDestructor(const NoDestructor&) = delete;
  NoDestructor& operator=(const NoDestructor&) = delete;

  // 中身まで const が伝わる、T へのスマートポインタのようにふるまう。
  // null ポインタは決して返さない。
  T& operator*() { return *get(); }
  T* absl_nonnull operator->() { return get(); }
  T* absl_nonnull get() { return impl_.get(); }
  const T& operator*() const { return *get(); }
  const T* absl_nonnull operator->() const { return get(); }
  const T* absl_nonnull get() const { return impl_.get(); }

 private:
  class DirectImpl {
   public:
    template <typename... Args>
    explicit constexpr DirectImpl(Args&&... args)
        : value_(std::forward<Args>(args)...) {}
    const T* absl_nonnull get() const { return &value_; }
    T* absl_nonnull get() { return &value_; }

   private:
    T value_;
  };

  class PlacementImpl {
   public:
    template <typename... Args>
    explicit PlacementImpl(Args&&... args) {
      new (&space_) T(std::forward<Args>(args)...);
    }
    const T* absl_nonnull get() const {
      return std::launder(reinterpret_cast<const T*>(&space_));
    }
    T* absl_nonnull get() {
      return std::launder(reinterpret_cast<T*>(&space_));
    }

   private:
    alignas(T) unsigned char space_[sizeof(T)];
  };

  // オブジェクトがトリビアルに破棄できるなら、メンバとして直接持ち、
  // 実行時の一度きりの初期化が起きうるのを避ける。この場合 NoDestructor の
  // 目的からはやや外れるが、こうしておくとジェネリックなコードから
  // 使いやすくなる。
  std::conditional_t<std::is_trivially_destructible_v<T>, DirectImpl,
                     PlacementImpl>
      impl_;
};
```

```cpp:line-numbers=112 [原文]
template <typename T>
class NoDestructor {
 public:
  // Forwards arguments to the T's constructor: calls T(args...).
  template <typename... Ts,
            // Disable this overload when it might collide with copy/move.
            std::enable_if_t<!std::is_same_v<void(std::decay_t<Ts>&...),
                                             void(NoDestructor&)>,
                             int> = 0>
  explicit constexpr NoDestructor(Ts&&... args)
      : impl_(std::forward<Ts>(args)...) {}

  // Forwards copy and move construction for T. Enables usage like this:
  //   static NoDestructor<std::array<string, 3>> x{{{"1", "2", "3"}}};
  //   static NoDestructor<std::vector<int>> x{{1, 2, 3}};
  explicit constexpr NoDestructor(const T& x) : impl_(x) {}
  explicit constexpr NoDestructor(T&& x)
      : impl_(std::move(x)) {}

  // No copying.
  NoDestructor(const NoDestructor&) = delete;
  NoDestructor& operator=(const NoDestructor&) = delete;

  // Pretend to be a smart pointer to T with deep constness.
  // Never returns a null pointer.
  T& operator*() { return *get(); }
  T* absl_nonnull operator->() { return get(); }
  T* absl_nonnull get() { return impl_.get(); }
  const T& operator*() const { return *get(); }
  const T* absl_nonnull operator->() const { return get(); }
  const T* absl_nonnull get() const { return impl_.get(); }

 private:
  class DirectImpl {
   public:
    template <typename... Args>
    explicit constexpr DirectImpl(Args&&... args)
        : value_(std::forward<Args>(args)...) {}
    const T* absl_nonnull get() const { return &value_; }
    T* absl_nonnull get() { return &value_; }

   private:
    T value_;
  };

  class PlacementImpl {
   public:
    template <typename... Args>
    explicit PlacementImpl(Args&&... args) {
      new (&space_) T(std::forward<Args>(args)...);
    }
    const T* absl_nonnull get() const {
      return std::launder(reinterpret_cast<const T*>(&space_));
    }
    T* absl_nonnull get() {
      return std::launder(reinterpret_cast<T*>(&space_));
    }

   private:
    alignas(T) unsigned char space_[sizeof(T)];
  };

  // If the object is trivially destructible we use a member directly to avoid
  // potential once-init runtime initialization. It somewhat defeats the
  // purpose of NoDestructor in this case, but this makes the class more
  // friendly to generic code.
  std::conditional_t<std::is_trivially_destructible_v<T>, DirectImpl,
                     PlacementImpl>
      impl_;
};
```

:::

## 前提知識

- **デストラクタ**: オブジェクトが消えるときに自動で呼ばれる後始末の関数です（`~T()`）。`static` 変数のデストラクタは、プログラムの終了時に呼ばれます。
- **終了時の破棄順の問題**: 終了時には `static` 変数が次々に破棄されます。破棄された変数を、別の変数のデストラクタや別スレッドがまだ使おうとすると、クラッシュの原因になります。
- **placement new**: `new (場所) T(引数)` と書くと、メモリを確保せずに、指定した場所に `T` を作ります。
- **`alignas(T) unsigned char space_[sizeof(T)]`**: `T` と同じ大きさ・同じ配置ルール（アライメント）を持つ、ただのバイト配列です。バイト配列にはデストラクタがありません。
- **`std::launder`**: 「このアドレスには、いま本当に `T` が置かれている」とコンパイラに伝える関数です。バイト配列から `T*` を取り出すときに、最適化による誤解を防ぎます。
- **`std::conditional_t<条件, A, B>`**: 条件が真なら型 `A`、偽なら型 `B` を選びます。
- **`= delete`**: その関数を使用禁止にします。ここではコピーを禁止しています。
- **推論ガイド**: 最後の `NoDestructor(T) -> NoDestructor<T>;` は、`NoDestructor x(42);` と書いたときに `T` を `int` と推論させる指示です。

## 何をしているか

### 1. コンストラクタ

```cpp:line-numbers=116
  template <typename... Ts,
            // コピー/ムーブと衝突しうるときは、このオーバーロードを無効にする。
            std::enable_if_t<!std::is_same_v<void(std::decay_t<Ts>&...),
                                             void(NoDestructor&)>,
                             int> = 0>
  explicit constexpr NoDestructor(Ts&&... args)
      : impl_(std::forward<Ts>(args)...) {}

  // T のコピー構築・ムーブ構築を転送する。次のような使い方ができる:
  // static NoDestructor<std::array<string, 3>> x{{{"1", "2", "3"}}};
  // static NoDestructor<std::vector<int>> x{{1, 2, 3}};
  explicit constexpr NoDestructor(const T& x) : impl_(x) {}
  explicit constexpr NoDestructor(T&& x)
      : impl_(std::move(x)) {}
```

引数をそのまま `T` のコンストラクタに渡します。
テンプレート引数の `enable_if_t` は、`NoDestructor` 自身を渡したときにこのコンストラクタが選ばれないようにするためのものです。そうしないと、コピーのつもりの呼び出しを「何でも受け取るコンストラクタ」が横取りしてしまいます。

### 2. スマートポインタのようなアクセス

```cpp:line-numbers=137
  T& operator*() { return *get(); }
  T* absl_nonnull operator->() { return get(); }
  T* absl_nonnull get() { return impl_.get(); }
  const T& operator*() const { return *get(); }
  const T* absl_nonnull operator->() const { return get(); }
  const T* absl_nonnull get() const { return impl_.get(); }
```

`*x`、`x->foo()`、`x.get()` で中身に触れます。`const` 版もあり、箱が `const` なら中身も `const` として扱われます（コメントでいう「深い const」）。

### 3. 2 つの実装

```cpp:line-numbers=145
  class DirectImpl {
   public:
    template <typename... Args>
    explicit constexpr DirectImpl(Args&&... args)
        : value_(std::forward<Args>(args)...) {}
    const T* absl_nonnull get() const { return &value_; }
    T* absl_nonnull get() { return &value_; }

   private:
    T value_;
  };

  class PlacementImpl {
   public:
    template <typename... Args>
    explicit PlacementImpl(Args&&... args) {
      new (&space_) T(std::forward<Args>(args)...);
    }
    const T* absl_nonnull get() const {
      return std::launder(reinterpret_cast<const T*>(&space_));
    }
    T* absl_nonnull get() {
      return std::launder(reinterpret_cast<T*>(&space_));
    }

   private:
    alignas(T) unsigned char space_[sizeof(T)];
  };
```

- `DirectImpl`: `T value_` を普通のメンバとして持ちます。
- `PlacementImpl`: バイト配列 `space_` を持ち、コンストラクタで placement new を使ってそこに `T` を作ります。

`PlacementImpl` にはデストラクタが書かれていません。そのメンバはバイト配列だけなので、箱が破棄されても `T` のデストラクタは誰も呼びません。これが「デストラクタを呼ばせない」仕組みの正体です。

### 4. どちらを使うか

```cpp:line-numbers=178
  std::conditional_t<std::is_trivially_destructible_v<T>, DirectImpl,
                     PlacementImpl>
      impl_;
```

`T` が **トリビアルに破棄できる型**（`int` など、破棄に何もしなくてよい型）なら `DirectImpl` を、そうでなければ `PlacementImpl` を使います。
`std::string` ならデストラクタでメモリを解放する必要があるので `PlacementImpl` になり、そのデストラクタは呼ばれません。

## ここがすごい

- **`new` で作ってポインタを持つ方法との比較**: ファイル冒頭のコメントにある `static const std::string* x = new std::string("foo");` も同じ目的の定番の書き方です。ただしヒープ確保が 1 回増え、ポインタをたどる手間もかかります。`NoDestructor` は `static` 変数の領域に直接オブジェクトを置くので、その両方がありません。
- **型に応じて実装を切り替える**: 破棄に何もしなくてよい型なら、わざわざバイト配列を使う理由がありません。`DirectImpl` なら `constexpr` で作れるので、実行時の初期化処理そのものを省ける場合があります。
- **コピーの横取りを防ぐ細かい配慮**: 「何でも受け取るコンストラクタ」は便利ですが、コピーコンストラクタより優先されてしまう落とし穴があります。`std::is_same_v<void(std::decay_t<Ts>&...), void(NoDestructor&)>` の条件でそれを避けています。
- **終了処理の不具合を構造で防ぐ**: 破棄しなければ「破棄後に使われる」問題は起きようがありません。メモリはプロセスの終了とともに OS が回収します。

## まとめ

- `static` 変数を終了時に破棄させないことで、破棄順の問題を根本から避けられる。
- バイト配列＋placement new で作ったオブジェクトは、明示しない限りデストラクタが呼ばれない。
- `std::conditional_t` を使うと、型の性質に応じて内部実装をコンパイル時に選べる。
- 転送コンストラクタはコピーを横取りしがちなので、自分自身の型を除外しておく。
