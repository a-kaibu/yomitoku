---
title: デバッグでは検査し、本番ではタダになるダウンキャスト
description: 基底クラスのポインタを派生クラスのポインタに変換する down_cast。コンパイル時に型の関係を確かめ、デバッグ時だけ dynamic_cast で中身を検査する。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/casts.h
lines: [206, 273]
function: down_cast
difficulty: 2
tags: [型システム, 防御的プログラミング, API設計]
---

## ひとことで

`absl::down_cast<Derived*>(base_ptr)` は、基底クラスへのポインタを派生クラスへのポインタに変換します（ダウンキャスト）。
本番ビルドでは、速い `static_cast` と同じコストで済みます。一方デバッグビルドでは、`dynamic_cast` で「本当にその型か」を確かめ、間違っていれば型名付きのメッセージでプログラムを止めます。

## コード

::: code-group

```cpp:line-numbers=206 [日本語訳]
template <typename To, typename From>
inline void ValidateDownCast(From* f) {
  // RTTI が有効で、かつデバッグモードかハードニング用の assert が有効なときだけ
  // 確認する。
#if defined(ABSL_INTERNAL_HAS_RTTI) && \
    (!defined(NDEBUG) || (ABSL_OPTION_HARDENED == 1))
  // 古い GCC が出す、nonnull の比較についての誤った警告を抑える。
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wnonnull-compare"
#endif
  if (ABSL_PREDICT_FALSE(f != nullptr && dynamic_cast<To>(f) == nullptr)) {
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic pop
#endif
    absl::base_internal::BadDownCastCrash(
        typeid(*f).name(), typeid(std::remove_pointer_t<To>).name());
  }
#else
  (void)f;  // 「使っている」ことにして警告を避ける
#endif
}

}  // namespace base_internal の終わり

// 「アップキャスト」、つまりオブジェクトへのポインタから基底サブオブジェクトへの
// ポインタへの変換は、基底が一意でアクセス可能なら必ず成功する。
// だから implicit_cast を使ってよい。
//
// 「ダウンキャスト」、つまりオブジェクトへのポインタから、元のオブジェクトを
// 基底サブオブジェクトとして含むかもしれない、より派生したオブジェクトへの
// ポインタへの変換は、static_cast では安全に行えない。元のオブジェクトが本当に
// 変換先の型の、より派生したオブジェクトの基底サブオブジェクトなのか、
// 一般には分からないからだ。そのため、
// ポリモーフィックな型の階層でダウンキャストするときは、次の
// 関数テンプレートを使うこと。
//
// この関数が null を返すのは、入力が null のときだけ。デバッグモードでは
// dynamic_cast でダウンキャストが正しいかを二重にチェックする（正しくなければ
// 落ちる）。通常モードでは効率のよい static_cast を使う。デバッグモードでは
// プロセスが落ちるので、この関数を呼ぶ前にキャストが正しいことを
// テストで確かめておくことが重要だ！
//
// dynamic_cast はスタイルガイドが許す場合を除いて避けるべき
// (https://google.github.io/styleguide/cppguide.html#Run-Time_Type_Information__RTTI_)。

template <typename To, typename From>  // 使い方: down_cast<T*>(foo);
[[nodiscard]]
inline To down_cast(From* f) {  // だからポインタしか受け付けない
  static_assert(std::is_pointer_v<To>, "target type not a pointer");
  // dynamic_cast は、同じ型や、より cv 修飾された同じ型への変換なら、
  // ポリモーフィックでなくても許す。
  if constexpr (!std::is_same_v<std::remove_cv_t<std::remove_pointer_t<To>>,
                                std::remove_cv_t<From>>) {
    static_assert(std::is_polymorphic_v<From>,
                  "source type must be polymorphic");
    static_assert(std::is_polymorphic_v<std::remove_pointer_t<To>>,
                  "target type must be polymorphic");
  }
  static_assert(
      std::is_convertible_v<std::remove_cv_t<std::remove_pointer_t<To>>*,
                            std::remove_cv_t<From>*>,
      "target type not derived from source type");

  absl::base_internal::ValidateDownCast<To>(f);

  return static_cast<To>(f);
}
```

```cpp:line-numbers=206 [原文]
template <typename To, typename From>
inline void ValidateDownCast(From* f) {
  // Assert only if RTTI is enabled and in debug mode or hardened asserts are
  // enabled.
#if defined(ABSL_INTERNAL_HAS_RTTI) && \
    (!defined(NDEBUG) || (ABSL_OPTION_HARDENED == 1))
  // Suppress erroneous nonnull comparison warning on older GCC.
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wnonnull-compare"
#endif
  if (ABSL_PREDICT_FALSE(f != nullptr && dynamic_cast<To>(f) == nullptr)) {
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic pop
#endif
    absl::base_internal::BadDownCastCrash(
        typeid(*f).name(), typeid(std::remove_pointer_t<To>).name());
  }
#else
  (void)f;  // Denote this as "used" to avoid warning
#endif
}

}  // namespace base_internal

// An "upcast", i.e. a conversion from a pointer to an object to a pointer to a
// base subobject, always succeeds if the base is unambiguous and accessible,
// and so it's fine to use implicit_cast.
//
// A "downcast", i.e. a conversion from a pointer to an object to a pointer
// to a more-derived object that may contain the original object as a base
// subobject, cannot safely be done using static_cast, because you do not
// generally know whether the source object is really the base subobject of
// a containing, more-derived object of the target type. Thus, when you
// downcast in a polymorphic type hierarchy, you should use the following
// function template.
//
// This function only returns null when the input is null. In debug mode, we
// use dynamic_cast to double-check whether the downcast is legal (we die if
// it's not). In normal mode, we do the efficient static_cast instead. Because
// the process will die in debug mode, it's important to test to make sure the
// cast is legal before calling this function!
//
// dynamic_cast should be avoided except as allowed by the style guide
// (https://google.github.io/styleguide/cppguide.html#Run-Time_Type_Information__RTTI_).

template <typename To, typename From>  // use like this: down_cast<T*>(foo);
[[nodiscard]]
inline To down_cast(From* f) {  // so we only accept pointers
  static_assert(std::is_pointer_v<To>, "target type not a pointer");
  // dynamic_cast allows casting to the same type or a more cv-qualified
  // version of the same type without them being polymorphic.
  if constexpr (!std::is_same_v<std::remove_cv_t<std::remove_pointer_t<To>>,
                                std::remove_cv_t<From>>) {
    static_assert(std::is_polymorphic_v<From>,
                  "source type must be polymorphic");
    static_assert(std::is_polymorphic_v<std::remove_pointer_t<To>>,
                  "target type must be polymorphic");
  }
  static_assert(
      std::is_convertible_v<std::remove_cv_t<std::remove_pointer_t<To>>*,
                            std::remove_cv_t<From>*>,
      "target type not derived from source type");

  absl::base_internal::ValidateDownCast<To>(f);

  return static_cast<To>(f);
}
```

:::

## 前提知識

- **継承とダウンキャスト**: `class Dog : public Animal` のように書くと、`Dog` は `Animal` の一種になります。`Animal*` を `Dog*` に変換するのがダウンキャストです。その `Animal*` が実は `Cat` を指していたら、変換は間違いです。
- **`static_cast<T>(x)`**: コンパイル時の情報だけで型を変換します。速いのですが、ダウンキャストが正しいかどうかは確かめません。
- **`dynamic_cast<T>(x)`**: 実行時に実際の型を調べ、間違っていれば `nullptr` を返します。RTTI（実行時型情報）が必要で、コストもかかります。
- **ポリモーフィックな型**: 仮想関数（`virtual`）を 1 つ以上持つクラスです。`dynamic_cast` が使えるのはこの型だけです。
- **`NDEBUG`**: 定義されているとリリースビルド扱いになり、`assert` などが消えるマクロです。
- **`if constexpr`**: 条件がコンパイル時に決まる `if` です。偽の側のコードはコンパイルされません。
- **`typeid(x).name()`**: 型の名前を表す文字列を返します。
- **`ABSL_PREDICT_FALSE(cond)`**: 「この条件はほぼ偽」とコンパイラに伝えるマクロです。

## 何をしているか

### 1. コンパイル時のチェック

```cpp:line-numbers=254
inline To down_cast(From* f) {  // だからポインタしか受け付けない
  static_assert(std::is_pointer_v<To>, "target type not a pointer");
  // dynamic_cast は、同じ型や、より cv 修飾された同じ型への変換なら、
  // ポリモーフィックでなくても許す。
  if constexpr (!std::is_same_v<std::remove_cv_t<std::remove_pointer_t<To>>,
                                std::remove_cv_t<From>>) {
    static_assert(std::is_polymorphic_v<From>,
                  "source type must be polymorphic");
    static_assert(std::is_polymorphic_v<std::remove_pointer_t<To>>,
                  "target type must be polymorphic");
  }
  static_assert(
      std::is_convertible_v<std::remove_cv_t<std::remove_pointer_t<To>>*,
                            std::remove_cv_t<From>*>,
      "target type not derived from source type");
```

`down_cast` 本体は、まず `static_assert` で次のことを確かめます。

- 変換先 `To` がポインタ型であること。`down_cast<Dog>(p)` のような書き間違いを防ぎます。
- 同じ型どうしの変換でない限り、両方の型がポリモーフィックであること。`dynamic_cast` を使えるようにするためです。
- 変換先が変換元の **派生クラス** であること。`Dog*` が `Animal*` に変換できるなら、`Dog` は `Animal` の子孫です。無関係な型へのキャストはここで弾かれます。

### 2. 実行時の検査

```cpp:line-numbers=206
template <typename To, typename From>
inline void ValidateDownCast(From* f) {
  // RTTI が有効で、かつデバッグモードかハードニング用の assert が有効なときだけ
  // 確認する。
#if defined(ABSL_INTERNAL_HAS_RTTI) && \
    (!defined(NDEBUG) || (ABSL_OPTION_HARDENED == 1))
  // 古い GCC が出す、nonnull の比較についての誤った警告を抑える。
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic push
#pragma GCC diagnostic ignored "-Wnonnull-compare"
#endif
  if (ABSL_PREDICT_FALSE(f != nullptr && dynamic_cast<To>(f) == nullptr)) {
#if defined(__GNUC__) && !defined(__clang__)
#pragma GCC diagnostic pop
#endif
    absl::base_internal::BadDownCastCrash(
        typeid(*f).name(), typeid(std::remove_pointer_t<To>).name());
  }
#else
  (void)f;  // 「使っている」ことにして警告を避ける
#endif
}
```

`ValidateDownCast` は、RTTI が使えて、かつデバッグビルドか「ハードニング」（本番でも安全チェックを残す設定）が有効なときだけ中身があります。

`Animal* p` が実は `Cat` を指しているのに `down_cast<Dog*>(p)` を呼んだとします。

- `f != nullptr` なので検査します。
- `dynamic_cast<Dog*>(p)` は `nullptr` を返すので、条件は真になります。
- `BadDownCastCrash` が呼ばれ、`typeid(*f).name()`（実際の型 `Cat`）と変換先の型名をメッセージに入れてプログラムを止めます。

`nullptr` を渡した場合は検査せずに通します。`nullptr` のダウンキャストは `nullptr` になるのが正しいからです。

### 3. 本番ビルドの場合

```cpp:line-numbers=224
#else
  (void)f;  // 「使っている」ことにして警告を避ける
#endif
```

`#else` 側は `(void)f;` だけです。これは「引数を使っていない」という警告を消すための書き方で、実行されるコードは何もありません。最後の `static_cast<To>(f)`だけが残ります。

## ここがすごい

- **コストと安全性を切り替えられる**: `dynamic_cast` を毎回使うのは遅く、`static_cast` だけだとバグに気づけません。この関数は、テスト中は厳しく検査し、本番では検査のコストをゼロにします。
- **間違いの種類ごとに検出のタイミングを変えている**: 「無関係な型への変換」はコンパイル時に分かるので `static_assert` で、「実際の中身が違う」は実行時でしか分からないので `dynamic_cast` で検出します。
- **失敗時のメッセージが具体的**: 単に止まるのではなく、元の型と変換先の型の名前を出してくれます。`BadDownCastCrash` は `casts.cc` 側にあり、型名を人間が読める形に戻す（デマングルする）処理もしています。
- **`[[noreturn]]` と `ABSL_ATTRIBUTE_NOINLINE`**: 失敗時の関数 `BadDownCastCrash` は、宣言で「戻ってこない」「インライン展開しない」と宣言されています。めったに通らない失敗処理を別の場所に追い出し、呼び出し元のコードを小さく保てます。

`ValidateDownCast` の中の `#pragma` は、古い GCC が出す誤った警告を一時的に止めるためのものです。

## まとめ

- ダウンキャストは `static_cast` だと検査されない。デバッグ時だけ `dynamic_cast` で確かめると安全と速さを両立できる。
- コンパイル時に分かる誤りは `static_assert` で、実行時にしか分からない誤りは実行時チェックで捕まえる。
- 失敗時は、原因の特定に役立つ情報（型名など）を出して止まる。
- めったに通らない失敗処理は別の関数に分け、`[[noreturn]]` を付けておく。
