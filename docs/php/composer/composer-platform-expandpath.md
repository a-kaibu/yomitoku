---
title: "パスの先頭の ~ や環境変数を、実際の場所に置き換える"
description: "Composer の Platform::expandPath は、設定ファイルに書かれた ~/cache や $HOME/bin のようなパスを、実際のパスに置き換えます。Windows では HOME を USERPROFILE の別名として扱います。"
language: php
project: Composer
repo: https://github.com/composer/composer
license: MIT
copyright: Copyright (c) Nils Adermann, Jordi Boggiano
commit: "ae54d59bec96633ae442a009f3793b0b450351cd"
file: src/Composer/Util/Platform.php
lines: [292, 310]
function: Platform::expandPath
difficulty: 2
format: 2
tags: [文字列処理, 正規表現, 移植性]
---

## ひとことで

`expandPath` は、設定に書かれた **省略形のパス** を、実際のパスに置き換える関数です。`~/` はユーザーのホームフォルダに、`$HOME` や `%APPDATA%` のような環境変数は、その値に置き換えます。

## コード

::: code-group

```php:line-numbers=292 [日本語訳]
    public static function expandPath(string $path): string
    {
        if (Preg::isMatch('#^~[\\/]#', $path)) {
            return self::getUserDirectory() . substr($path, 1);
        }

        return Preg::replaceCallback('#^(\$|(?P<percent>%))(?P<var>\w++)(?(percent)%)(?P<path>.*)#', static function ($matches): string {
            // 互換性のため、Windows では HOME を USERPROFILE の代わりに使う。
            if (Platform::isWindows() && $matches['var'] === 'HOME') {
                if ((bool) Platform::getEnv('HOME')) {
                    return Platform::getEnv('HOME') . $matches['path'];
                }

                return Platform::getEnv('USERPROFILE') . $matches['path'];
            }

            return Platform::getEnv($matches['var']) . $matches['path'];
        }, $path);
    }
```

```php:line-numbers=292 [原文]
    public static function expandPath(string $path): string
    {
        if (Preg::isMatch('#^~[\\/]#', $path)) {
            return self::getUserDirectory() . substr($path, 1);
        }

        return Preg::replaceCallback('#^(\$|(?P<percent>%))(?P<var>\w++)(?(percent)%)(?P<path>.*)#', static function ($matches): string {
            // Treat HOME as an alias for USERPROFILE on Windows for legacy reasons
            if (Platform::isWindows() && $matches['var'] === 'HOME') {
                if ((bool) Platform::getEnv('HOME')) {
                    return Platform::getEnv('HOME') . $matches['path'];
                }

                return Platform::getEnv('USERPROFILE') . $matches['path'];
            }

            return Platform::getEnv($matches['var']) . $matches['path'];
        }, $path);
    }
```

:::

## 前提知識

- **ホームディレクトリ**: ユーザーごとの作業用フォルダです。Linux では `/home/ユーザー名`、Windows では `C:\Users\ユーザー名` のような場所です。
- **環境変数**: OS が持つ名前付きの値です。`HOME` や `USERPROFILE` のように、場所を表すものがよく使われます。
- **`preg_replace_callback`**: 正規表現で見つけた部分を、関数で置き換える関数です。Composer では `Preg` という安全なラッパーを通して使っています。
- **名前付きグループ `(?P<name>...)`**: 正規表現の一致から、名前で値を取り出せる書き方です。
- **`substr($path, 1)`**: 文字列の 1 文字目以降を取り出す関数です。`~` を取り除くために使われています。

## 何をしているか

### 1. `~/` は、ホームフォルダに置き換える

```php:line-numbers=294
        if (Preg::isMatch('#^~[\\/]#', $path)) {
            return self::getUserDirectory() . substr($path, 1);
        }
```

パスが `~/` か `~\` で始まっていれば、ホームフォルダのパスに `~` の後ろを付けます。`getUserDirectory` が、現在のユーザーの場所を返します。

### 2. `$VAR` や `%VAR%` は、環境変数に置き換える

::: code-group

```php:line-numbers=298 [日本語訳]
        return Preg::replaceCallback('#^(\$|(?P<percent>%))(?P<var>\w++)(?(percent)%)(?P<path>.*)#', static function ($matches): string {
            // 互換性のため、Windows では HOME を USERPROFILE の代わりに使う。
            if (Platform::isWindows() && $matches['var'] === 'HOME') {
                if ((bool) Platform::getEnv('HOME')) {
                    return Platform::getEnv('HOME') . $matches['path'];
                }

                return Platform::getEnv('USERPROFILE') . $matches['path'];
            }

            return Platform::getEnv($matches['var']) . $matches['path'];
        }, $path);
```

```php:line-numbers=298 [原文]
        return Preg::replaceCallback('#^(\$|(?P<percent>%))(?P<var>\w++)(?(percent)%)(?P<path>.*)#', static function ($matches): string {
            // Treat HOME as an alias for USERPROFILE on Windows for legacy reasons
            if (Platform::isWindows() && $matches['var'] === 'HOME') {
                if ((bool) Platform::getEnv('HOME')) {
                    return Platform::getEnv('HOME') . $matches['path'];
                }

                return Platform::getEnv('USERPROFILE') . $matches['path'];
            }

            return Platform::getEnv($matches['var']) . $matches['path'];
        }, $path);
```

:::

正規表現 `#^(\$|(?P<percent>%))(?P<var>\w++)(?(percent)%)(?P<path>.*)#` は、先頭が `$名前` か `%名前%` のパスにマッチします。`var` が変数名、`path` がその後ろの部分です。変数の値に、後ろの `path` をつないで返します。

### 3. Windows では、HOME を USERPROFILE として扱う

::: code-group

```php:line-numbers=299 [日本語訳]
            // 互換性のため、Windows では HOME を USERPROFILE の代わりに使う。
            if (Platform::isWindows() && $matches['var'] === 'HOME') {
                if ((bool) Platform::getEnv('HOME')) {
                    return Platform::getEnv('HOME') . $matches['path'];
                }

                return Platform::getEnv('USERPROFILE') . $matches['path'];
            }
```

```php:line-numbers=299 [原文]
            // Treat HOME as an alias for USERPROFILE on Windows for legacy reasons
            if (Platform::isWindows() && $matches['var'] === 'HOME') {
                if ((bool) Platform::getEnv('HOME')) {
                    return Platform::getEnv('HOME') . $matches['path'];
                }

                return Platform::getEnv('USERPROFILE') . $matches['path'];
            }
```

:::

Windows には `HOME` がない場合が多く、古い設定との互換のために、`HOME` を指定されたら `USERPROFILE` を使います。`HOME` が設定されていれば、それを優先します。

具体例として `$HOME/bin` は、Linux なら `/home/ユーザー名/bin` のように置き換わります。

## ここがすごい

### 書き方の違いを、1 つの関数で吸収している

`~/`、`$VAR/`、`%VAR%/` は、どれも「場所の省略形」です。設定ファイルの書き手は、どの書き方を使ってもかまいません。この関数が、正規表現の 1 つのパターンで、3 つの書き方をまとめて扱っています。

### 互換性のための例外を、コメントで説明している

::: code-group

```php:line-numbers=299 [日本語訳]
            // 互換性のため、Windows では HOME を USERPROFILE の代わりに使う。
```

```php:line-numbers=299 [原文]
            // Treat HOME as an alias for USERPROFILE on Windows for legacy reasons
```

:::

Windows で `HOME` を特別扱いするのは、古い設定ファイルが動くようにするためです。理由がコメントに書かれているので、後から読む人も判断しやすくなっています。

### 「置き換えの元」を、Windows だけ切り替える

Windows かどうかは、環境に応じて判定します。同じパスの書き方でも、OS に応じた正しい場所が得られる仕組みです。

## まとめ

- 省略形のパスは、1 つの正規表現で複数の書き方をまとめて扱える。
- 名前付きグループを使うと、一致した部分の意味が読み取りやすくなる。
- OS ごとの違いは、判定して分岐させると、移植性を保てる。
- 互換性のための例外には、理由をコメントで書いておくと後の人が助かる。
