---
title: "列挙型と文字列の相互変換を 1 行で生やす文字列テーブル"
description: "enum の値と名前の対応表を配列で書き、DEFINE_STRING_TABLE_LOOKUP(name, type) と書くだけで name_to_string と name_from_string を生成する。## による関数名の組み立て。"
language: c
project: systemd
repo: https://github.com/systemd/systemd
license: LGPL-2.1-or-later
copyright: "Copyright (C) the systemd authors"
commit: "86025ff125b025390ba869f3ae0fbce9bdbcdb9c"
file: src/basic/string-table.h
lines: [16, 44]
function: "DEFINE_STRING_TABLE_LOOKUP"
difficulty: 2
format: 2
tags: [マクロ, メタプログラミング, 文字列処理, 設計パターン]
---

## ひとことで

systemd には「列挙型の値 ⇔ 設定ファイルに書く文字列」の変換がたくさんあります。たとえば `MANAGED_OOM_KILL` と `"kill"` です。
このマクロ群を使うと、対応表の配列を 1 つ書いて `DEFINE_STRING_TABLE_LOOKUP(managed_oom_mode, ManagedOOMMode);` と添えるだけで、
`managed_oom_mode_to_string()` と `managed_oom_mode_from_string()` の 2 つの関数が自動で作られます。

## コード

::: code-group

```c:line-numbers=16 [日本語訳]
/* 厳密に列挙された項目を持つ、基本的な対応表のためのもの */
#define _DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)                                        \
        scope const char* name##_to_string(type i) {                                                    \
                return string_table_lookup_to_string(name##_table, ELEMENTSOF(name##_table), i);        \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING(name, type, scope) \
        scope type name##_from_string(const char *s) {             \
                return (type) string_table_lookup_from_string(name##_table, ELEMENTSOF(name##_table), s); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING_WITH_BOOLEAN(name, type, yes, scope) \
        scope type name##_from_string(const char *s) {                               \
                return (type) string_table_lookup_from_string_with_boolean(name##_table, ELEMENTSOF(name##_table), s, yes); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_TO_STRING_FALLBACK(name, type, max, scope)                          \
        scope int name##_to_string_alloc(type i, char **ret) {                                          \
                return string_table_lookup_to_string_fallback(name##_table, ELEMENTSOF(name##_table), i, max, ret); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING_FALLBACK(name, type, max, scope) \
        scope type name##_from_string(const char *s) {                           \
                return (type) string_table_lookup_from_string_fallback(name##_table, ELEMENTSOF(name##_table), s, max); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP(name, type, scope)                    \
        _DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)          \
        _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING(name, type, scope)
```

```c:line-numbers=16 [原文]
/* For basic lookup tables with strictly enumerated entries */
#define _DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)                                        \
        scope const char* name##_to_string(type i) {                                                    \
                return string_table_lookup_to_string(name##_table, ELEMENTSOF(name##_table), i);        \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING(name, type, scope) \
        scope type name##_from_string(const char *s) {             \
                return (type) string_table_lookup_from_string(name##_table, ELEMENTSOF(name##_table), s); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING_WITH_BOOLEAN(name, type, yes, scope) \
        scope type name##_from_string(const char *s) {                               \
                return (type) string_table_lookup_from_string_with_boolean(name##_table, ELEMENTSOF(name##_table), s, yes); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_TO_STRING_FALLBACK(name, type, max, scope)                          \
        scope int name##_to_string_alloc(type i, char **ret) {                                          \
                return string_table_lookup_to_string_fallback(name##_table, ELEMENTSOF(name##_table), i, max, ret); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING_FALLBACK(name, type, max, scope) \
        scope type name##_from_string(const char *s) {                           \
                return (type) string_table_lookup_from_string_fallback(name##_table, ELEMENTSOF(name##_table), s, max); \
        }

#define _DEFINE_STRING_TABLE_LOOKUP(name, type, scope)                    \
        _DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)          \
        _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING(name, type, scope)
```

:::

## 前提知識

- **列挙型 `enum`**: 名前付きの整数定数の集まりです。`enum { MANAGED_OOM_AUTO, MANAGED_OOM_KILL }` なら、それぞれ 0、1 になります。
- **指示付き初期化子つきの配列**: `[MANAGED_OOM_KILL] = "kill"` のように、添字を指定して配列を初期化できます。列挙型の値を添字にすれば、値と文字列の対応表になります。
- **`const char* const *`**: 「書き換えられない文字列」を指すポインタの配列です。
- **マクロの `##`**: 2 つの字句をつないで 1 つの名前にします。`name##_to_string` は、`name` が `managed_oom_mode` なら `managed_oom_mode_to_string` になります。
- **空のマクロ引数**: マクロには空の引数を渡せます。`_DEFINE_STRING_TABLE_LOOKUP(name, type,)` の最後の引数は空で、展開すると何も残りません。
- **`static`**: 関数に付けると「このファイルの中だけで使える」になります。
- **`ELEMENTSOF(x)`**: systemd のマクロで、配列 `x` の要素数を返します（ポインタを渡すとコンパイルエラーになる安全版）。

## 何をしているか

### 1. 値から文字列へ

```c:line-numbers=16
/* For basic lookup tables with strictly enumerated entries */
#define _DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)                                        \
        scope const char* name##_to_string(type i) {                                                    \
                return string_table_lookup_to_string(name##_table, ELEMENTSOF(name##_table), i);        \
        }
```

`_DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)` は、`name_to_string(type i)` という関数を生成します。
表の名前は必ず `name##_table` です。つまり「`managed_oom_mode_table` という配列を用意しておく」という命名規則が前提になっています。
呼ばれる `string_table_lookup_to_string`（`string-table.c`）は、範囲外の値なら `NULL` を、そうでなければ `table[i]` を返します。

### 2. 文字列から値へ

```c:line-numbers=22
#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING(name, type, scope) \
        scope type name##_from_string(const char *s) {             \
                return (type) string_table_lookup_from_string(name##_table, ELEMENTSOF(name##_table), s); \
        }
```

`name_from_string(const char *s)` は、`string_table_lookup_from_string` で表を先頭から順に比べ、見つかった添字を返します。見つからなければ `-EINVAL` です。
戻り値を `(type)` にキャストしているので、呼び出し側は列挙型の値として受け取れます（失敗時は負の値になります）。

### 3. 「yes/no」も受け付ける版

```c:line-numbers=27
#define _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING_WITH_BOOLEAN(name, type, yes, scope) \
        scope type name##_from_string(const char *s) {                               \
                return (type) string_table_lookup_from_string_with_boolean(name##_table, ELEMENTSOF(name##_table), s, yes); \
        }
```

`_WITH_BOOLEAN` 版は、先に `parse_boolean` で `"yes"`、`"no"`、`"1"`、`"0"` などを試し、偽なら `0`、真なら引数 `yes` に指定した値を返します。
設定項目に「`yes` と書いたら、この値と同じ意味」という互換性を持たせたいときに使います。

### 4. 組み合わせ

```c:line-numbers=42
#define _DEFINE_STRING_TABLE_LOOKUP(name, type, scope)                    \
        _DEFINE_STRING_TABLE_LOOKUP_TO_STRING(name, type, scope)          \
        _DEFINE_STRING_TABLE_LOOKUP_FROM_STRING(name, type, scope)
```

`_DEFINE_STRING_TABLE_LOOKUP` は、上の 2 つをまとめて生成します。このファイルの後半では、`scope` を空にした公開版 `DEFINE_STRING_TABLE_LOOKUP` と、`static` を入れた非公開版 `DEFINE_PRIVATE_STRING_TABLE_LOOKUP` が定義されています。

使う側は、たとえば `src/basic/cgroup-util.c` で次のように書いています。

```c
static const char* const managed_oom_mode_table[_MANAGED_OOM_MODE_MAX] = {
        [MANAGED_OOM_AUTO] = "auto",
        [MANAGED_OOM_KILL] = "kill",
};

DEFINE_STRING_TABLE_LOOKUP(managed_oom_mode, ManagedOOMMode);
```

## ここがすごい

- **対応表が 1 か所にまとまる**: 素直に書くと、`switch` で値→文字列、`if (strcmp(...))` の連続で文字列→値、と 2 つの関数を書くことになります。値を追加するたびに両方を直す必要があり、片方を忘れるとずれます。表を 1 つにすれば、追加は 1 行で済みます。
- **命名規則をマクロが強制**: `name_table`、`name_to_string`、`name_from_string` という名前が必ず揃うので、どの型についても同じ関数名で変換できると予想できます。
- **`scope` 引数で公開範囲を切り替え**: 同じマクロに `static` か空かを渡すだけで、公開用と内部用を作り分けています。マクロの数を増やさずに済む、空引数のうまい使い方です。
- **実処理は共通関数に集約**: 生成される関数は 1 行の「つなぎ」だけで、実際の探索は `string-table.c` の 1 か所に書かれています。マクロで大きなコードを量産しないので、バイナリも大きくならず、バグ修正も 1 か所で済みます。

## まとめ

- 列挙型の値を添字にした文字列配列は、値と名前の対応表として使える。
- `##` で関数名と表の名前を組み立てると、命名規則をマクロで強制できる。
- 空のマクロ引数を使えば、`static` の有無のような違いを 1 つのマクロで扱える。
- マクロが生成するのは薄いつなぎだけにし、本体は共通関数にまとめるとよい。
