---
title: URLからパスワードを消して、ログに残しても安全にする
description: Composer の Url::stripCredentials は、URL に含まれるユーザー名とパスワードを、ログやエラー表示に出さないように取り除きます。正規表現の名前付きグループと、場合分けのコールバックを使います。
language: php
project: Composer
repo: https://github.com/composer/composer
license: MIT
copyright: Copyright (c) Nils Adermann, Jordi Boggiano
commit: "e1460b9e86fee91bf99dfde2dbe9d4fd8e325c1f"
file: src/Composer/Util/Url.php
lines: [159, 168]
function: Url::stripCredentials
difficulty: 3
format: 2
tags: [セキュリティ, 正規表現, ネットワーク]
---
## ひとことで

`stripCredentials` は、`https://user:secret@example.com/` のような URL から、ユーザー名とパスワードを取り除く関数です。エラーメッセージやログに URL を出すとき、認証情報が漏れないようにするために使われます。

## コード

```php:line-numbers=159
    public static function stripCredentials(string $url): string
    {
        return Preg::replaceCallback('{(?P<prefix>[a-z0-9][a-z0-9+.-]*://)(?P<user>[^:/\s?#]*)(?::(?P<password>[^\s/?#]*))?@}i', static function ($m): string {
            if (($m['password'] ?? '') === '' && !Preg::isMatch('{^https?://$}i', $m['prefix'])) {
                return $m['prefix'].$m['user'].'@';
            }

            return $m['prefix'];
        }, $url);
    }
```

## 前提知識

- **正規表現の名前付きグループ `(?P<名前>...)`**: 一致した部分を番号ではなく名前で取り出せる書き方です。`$m['password']` のように使います。
- **`preg_replace_callback`**: 一致した部分ごとに、関数の戻り値で置き換える関数です。ここでは `Preg::replaceCallback` という Composer の薄いラッパーを使っています。
- **URL の形**: `スキーム://ユーザー名:パスワード@ホスト/パス` の順に並びます。`@` より前がユーザー情報です。
- **`??`**: 左側が `null` のときに右側を使う演算子です。パスワードの無い URL では、グループの値が無いことがあるので、空文字として扱います。
- **無名関数 `static function`**: 名前を付けずに書く関数です。`static` は、外側のオブジェクトを参照しないことを示します。

## 何をしているか

### 1. ユーザー情報の部分を見つける

```php:line-numbers=161
        return Preg::replaceCallback('{(?P<prefix>[a-z0-9][a-z0-9+.-]*://)(?P<user>[^:/\s?#]*)(?::(?P<password>[^\s/?#]*))?@}i', static function ($m): string {
```

正規表現は、3 つの部分を取り出します。`prefix` はスキーム（`https://` など）、`user` はユーザー名、`password` はパスワードです。パスワードの部分は `(?:...)?` で任意なので、無い URL にも一致します。`@` で終わる部分までを、まとめて対象にしています。

### 2. パスワードがなく、http(s) でもないなら、ユーザー名だけ残す

```php:line-numbers=162
            if (($m['password'] ?? '') === '' && !Preg::isMatch('{^https?://$}i', $m['prefix'])) {
                return $m['prefix'].$m['user'].'@';
            }
```

パスワードが空で、かつ `http://` か `https://` ではない場合は、ユーザー名だけを残します。たとえば `ssh://git@example.com` は、`ssh://git@` の形で残ります。ユーザー名が鍵の名前として意味を持つ場合があるためです。

### 3. それ以外は、ユーザー情報をすべて消す

```php:line-numbers=166
            return $m['prefix'];
```

パスワードがある場合や、http(s) の場合は、スキームだけを返します。つまり、`@` より前のユーザー情報はすべて消えます。`https://user:secret@example.com/` は `https://example.com/` になります。

## ここがすごい

- **場面に応じて消す量を変える**: ユーザー名は残しても害が少ない場合と、すべて消すべき場合を、プロトコルとパスワードの有無で分けています。
- **名前付きグループで読みやすさを確保**: 番号で `$m[1]` と書くより、`$m['password']` と書いたほうが、正規表現の意味が読み手に伝わります。
- **正規表現を 1 回だけ使う**: 対象の部分を 1 回の検索で見つけ、コールバックで置き換えます。文字列を何度も切り貼りしなくて済みます。
- **既定で安全側に倒す**: 判断に迷う場合（パスワードがある場合など）は、ユーザー情報をすべて消す側に寄せています。

## まとめ

- 認証情報を隠す処理は、正規表現の名前付きグループで必要な部分を取り出すと読みやすい。
- 同じ URL でも、プロトコルとパスワードの有無で、残す情報を変えられる。
- 判断に迷う場合は、情報を消す側に倒すと安全。
- 置き換えの判断は、コールバック関数に書くと、場合分けを明確に書ける。
