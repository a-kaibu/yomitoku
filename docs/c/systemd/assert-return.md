---
title: "公開 API の引数チェックを 1 行にする assert_return"
description: "呼び出し側の誤りを見つけたら、ログに記録してエラーコードを返すマクロ。プログラムを止める assert と、黙って返す if 文のあいだを取った systemd 流の防御。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/basic/assert-util.h
lines: [6, 29]
function: "assert_return"
difficulty: 2
format: 2
tags: [エラー処理, 防御的プログラミング, マクロ, API設計]
---

## ひとことで

`assert_return(bus, -EINVAL);` は、「`bus` が `NULL` だったら、ログを残して `-EINVAL` を返す」という意味のマクロです。
systemd のライブラリ（`sd-bus` など）の公開関数の先頭には、これがずらりと並んでいます。
普通の `assert` と違い、条件が偽でも **プログラムは止まらず**、呼び出し元にエラーが返ります。

## コード

::: code-group

```c:line-numbers=6 [日本語訳]
/* さまざまなアサーションのためのログ出力 */

bool log_get_assert_return_is_critical(void) _weak_ _pure_;

void log_assert_failed_return(const char *text, const char *file, int line, const char *func);

#define assert_log(expr)                                                \
        (_likely_(expr) ?                                               \
         true :                                                         \
         (log_assert_failed_return(#expr, PROJECT_FILE, __LINE__, __func__), false))

#define assert_return(expr, r)                                          \
        do {                                                            \
                if (!assert_log(expr))                                  \
                        return (r);                                     \
        } while (false)

#define assert_return_errno(expr, r, err)                               \
        do {                                                            \
                if (!assert_log(expr)) {                                \
                        errno = err;                                    \
                        return (r);                                     \
                }                                                       \
        } while (false)
```

```c:line-numbers=6 [原文]
/* Logging for various assertions */

bool log_get_assert_return_is_critical(void) _weak_ _pure_;

void log_assert_failed_return(const char *text, const char *file, int line, const char *func);

#define assert_log(expr)                                                \
        (_likely_(expr) ?                                               \
         true :                                                         \
         (log_assert_failed_return(#expr, PROJECT_FILE, __LINE__, __func__), false))

#define assert_return(expr, r)                                          \
        do {                                                            \
                if (!assert_log(expr))                                  \
                        return (r);                                     \
        } while (false)

#define assert_return_errno(expr, r, err)                               \
        do {                                                            \
                if (!assert_log(expr)) {                                \
                        errno = err;                                    \
                        return (r);                                     \
                }                                                       \
        } while (false)
```

:::

## 前提知識

- **`assert(expr)`**: C の標準マクロで、`expr` が偽ならメッセージを出してプログラムを強制終了します。開発中のバグ発見に使います。
- **負の errno**: systemd では、関数が失敗したとき `-EINVAL`（引数が不正）や `-ENOMEM`（メモリ不足）のような **負のエラー番号** を返す作法です。0 以上は成功を表します。
- **マクロの `#expr`**: マクロの引数の前に `#` を付けると、その引数を **文字列** に変えます。`assert_log(bus != NULL)` なら `"bus != NULL"` という文字列が作られます。
- **`__LINE__`、`__func__`**: コンパイラが用意する定数で、それぞれ「この行の番号」「この関数の名前」です。
- **`do { ... } while (false)`**: 複数の文を 1 つの文として扱うための定番の包み方です。`if (x) assert_return(...); else ...` のように書いても正しく動きます。
- **三項演算子とカンマ演算子**: `a ? b : c` は「`a` が真なら `b`、偽なら `c`」。`(f(), false)` は「`f()` を実行してから `false` を値にする」という書き方です。
- **`_likely_(x)`**: `__builtin_expect(!!(x), 1)` の短縮で、「たいてい真になる」とコンパイラに教えて、真の場合の処理を速く配置させます。
- **弱いシンボル（`_weak_`）**: リンク時に定義が見つからなくてもエラーにせず、関数のアドレスが `NULL` になる宣言です。

## 何をしているか

### 1. assert_log: 調べて、ダメならログ

```c:line-numbers=12
#define assert_log(expr)                                                \
        (_likely_(expr) ?                                               \
         true :                                                         \
         (log_assert_failed_return(#expr, PROJECT_FILE, __LINE__, __func__), false))
```

`assert_log(expr)` は式です。`expr` が真なら `true`。偽なら `log_assert_failed_return(...)` を呼んでから `false` になります。
ログ関数には `#expr` で作った条件式の文字列、ファイル名、行番号、関数名が渡されます。
`src/basic/assert-util.c` の実装を見ると、通常はデバッグレベルで `Assertion 'bus' failed at ..., ignoring.` という形のメッセージを出すだけです。

### 2. assert_return: ダメなら return

```c:line-numbers=17
#define assert_return(expr, r)                                          \
        do {                                                            \
                if (!assert_log(expr))                                  \
                        return (r);                                     \
        } while (false)
```

`assert_return(expr, r)` は `assert_log` が偽のときに `return (r);` します。たとえば

```c
int sd_bus_open(sd_bus **ret) {
        assert_return(ret, -EINVAL);
        ...
```

で `ret` が `NULL` なら、ログを残して `-EINVAL` を返し、それ以降の処理は実行されません。

### 3. errno も設定する版

```c:line-numbers=23
#define assert_return_errno(expr, r, err)                               \
        do {                                                            \
                if (!assert_log(expr)) {                                \
                        errno = err;                                    \
                        return (r);                                     \
                }                                                       \
        } while (false)
```

`assert_return_errno(expr, r, err)` は、戻り値が `NULL` や `-1` のような「errno を見てね」という形の関数用です。返す前に `errno = err;` も設定します。

### 4. 致命的にする切り替え

```c:line-numbers=8
bool log_get_assert_return_is_critical(void) _weak_ _pure_;
```

`log_get_assert_return_is_critical` は弱いシンボルとして宣言されています。
`assert-util.c` では、この関数が存在してかつ真を返すときだけ、普通の `assert` と同じく強制終了します。テストなどで「呼び出し側の誤用を厳しく見つけたい」場合に使える仕組みです。

## ここがすごい

- **ライブラリ向けの「ちょうどよい厳しさ」**: ライブラリの中で `assert` を使うと、呼び出し側のちょっとしたミスでアプリ全体が落ちてしまいます。一方、`if (!bus) return -EINVAL;` と黙って返すと、バグに気づけません。`assert_return` はログを残しつつエラーを返すので、両方の欠点を避けています。
- **1 行で読める契約**: 関数の先頭に `assert_return(...)` が並ぶと、それがそのまま「この関数が受け付ける引数の条件」の一覧になります。ドキュメント代わりにもなります。
- **失敗時の情報が豊富**: `#expr`、`PROJECT_FILE`、`__LINE__`、`__func__` が自動で渡るので、ログを見ればどの条件がどこで破られたかすぐわかります。
- **速さへの配慮**: `_likely_` で「普通は成功する」とコンパイラに伝えているので、チェックのコストは比較 1 回ぶんほどに抑えられます。

## まとめ

- `assert_return(expr, r)` は「条件が偽ならログを出して `r` を返す」マクロ。
- 強制終了する `assert` と、黙って返す `if` の中間で、ライブラリの公開 API に向いている。
- `#expr` や `__LINE__` を使うと、失敗した条件と場所をログに自動で残せる。
- 弱いシンボルで「致命的にする」モードを外から切り替えられる。
