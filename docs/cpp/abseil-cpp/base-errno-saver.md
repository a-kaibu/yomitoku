---
title: スコープを抜けたら errno を元に戻す 10 行の RAII
description: C のグローバルなエラー番号 errno を、コンストラクタで保存しデストラクタで復元するクラス。途中でどんな関数を呼んでも、呼び出し元から見た errno は変わらない。
language: cpp
project: Abseil
repo: https://github.com/abseil/abseil-cpp
license: Apache-2.0
commit: "4ce33a3b8a55d727ccb50d4134f869d1689039f2"
format: 2
copyright: Copyright 2017 The Abseil Authors.
file: absl/base/internal/errno_saver.h
lines: [26, 37]
function: base_internal::ErrnoSaver
difficulty: 1
tags: [イディオム, エラー処理, 設計パターン]
---

## ひとことで

`ErrnoSaver` は、作られた瞬間の `errno` を覚えておき、**消えるときに `errno` を元の値に書き戻す** だけのクラスです。
関数の先頭で `ErrnoSaver saver;` と 1 行書くだけで、その関数の中で `errno` が書き換わっても、呼び出し元には影響しなくなります。

## コード

::: code-group

```cpp:line-numbers=26 [日本語訳]
// `ErrnoSaver` は、構築時に `errno` の値を記録し、破棄時に
// それを元に戻す。低レベルのコードで使うので、とても速くなければならない。
// デバッグモードであっても、計測用のコードを追加しないこと。
class ErrnoSaver {
 public:
  ErrnoSaver() : saved_errno_(errno) {}
  ~ErrnoSaver() { errno = saved_errno_; }
  int operator()() const { return saved_errno_; }

 private:
  const int saved_errno_;
};
```

```cpp:line-numbers=26 [原文]
// `ErrnoSaver` captures the value of `errno` upon construction and restores it
// upon deletion.  It is used in low-level code and must be super fast.  Do not
// add instrumentation, even in debug modes.
class ErrnoSaver {
 public:
  ErrnoSaver() : saved_errno_(errno) {}
  ~ErrnoSaver() { errno = saved_errno_; }
  int operator()() const { return saved_errno_; }

 private:
  const int saved_errno_;
};
```

:::

## 前提知識

- **`errno`**: C の標準ライブラリやシステムコールが「直前に起きたエラーの番号」を書き込む変数です（実際はスレッドごとに別の値を持ちます）。`open` が失敗したら `errno` に `ENOENT`（ファイルがない）などが入ります。
- **errno の困ったところ**: 成功した関数でも `errno` を書き換えることがあります。エラーを調べる前に別の関数を呼ぶと、知りたかった値が上書きされてしまいます。
- **コンストラクタ / デストラクタ**: `ErrnoSaver()` はオブジェクトが作られたとき、`~ErrnoSaver()` は消えるときに自動で呼ばれる関数です。
- **RAII**: 「資源の確保をオブジェクトの初期化に、解放を破棄に結び付ける」という C++ の基本的な考え方です。スコープを抜ける方法が `return` でも例外でも、デストラクタは必ず呼ばれます。
- **メンバ初期化子 `: saved_errno_(errno)`**: コンストラクタの本体より前に、メンバ変数を初期化する書き方です。`const` なメンバはこの方法でしか初期化できません。
- **`operator()`**: オブジェクトを関数のように `saver()` と呼べるようにする演算子です。

## 何をしているか

### 1. 保存

```cpp:line-numbers=31
  ErrnoSaver() : saved_errno_(errno) {}
```

コンストラクタで、そのときの `errno` を `saved_errno_` にコピーします。メンバは `const int` なので、一度決めたら変わりません。

### 2. 復元

```cpp:line-numbers=32
  ~ErrnoSaver() { errno = saved_errno_; }
```

デストラクタで `errno = saved_errno_;` と書き戻します。

### 3. 保存した値を読む

```cpp:line-numbers=33
  int operator()() const { return saved_errno_; }
```

`saver()` と呼ぶと、保存した値を返します。途中で `errno` が変わっても、入口での値を確認できます。

### 4. 使い方の例

同じ Abseil の `StrError`（`absl/base/internal/strerror.cc`）は、先頭でこのクラスを使っています（以下は説明用に簡略化した形です）。

```cpp
std::string StrError(int errnum) {
  absl::base_internal::ErrnoSaver errno_saver;
  // ... strerror_r や snprintf を呼ぶ ...
}
```

`errno = 2` の状態で `StrError(2)` を呼んだとします。中で呼ぶ関数が `errno` を 34 に変えたとしても、`StrError` から戻るときに `errno_saver` のデストラクタが走り、`errno` は 2 に戻ります。
呼び出し側は「エラーメッセージを作ったせいでエラー番号が変わった」という混乱に巻き込まれません。

## ここがすごい

- **戻し忘れが起きない**: 手で書くなら、関数の入口で `int saved = errno;`、すべての `return` の前で `errno = saved;` が必要です。`return` が増えるたびに戻し忘れの危険があります。RAII にすれば、どの出口から出ても自動で戻ります。
- **極限まで軽い**: クラスの上のコメントにあるとおり、低レベルのコードで使うので「とても速くなければならない、デバッグ用の計測も入れるな」と決めています。中身は `int` のコピー 2 回だけで、コンパイラはこれを完全にインライン展開できます。
- **`const` メンバで意図を固定**: 保存した値を誤って書き換えるコードは、そもそもコンパイルできません。
- **関数呼び出し演算子で値を見せる**: getter の名前を考えずに `saver()` で値が取れます。短く書けて、「保存した errno そのもの」という意味も伝わります。

## まとめ

- 「入口で保存、出口で復元」は RAII クラスにすると、戻し忘れがなくなる。
- RAII は `return` でも例外でも確実に後始末をしてくれる。
- ライブラリ関数は、呼び出し元の `errno` を勝手に変えないように配慮するとよい。
- 小さな道具は、小さく軽く保つことにも意味がある。
