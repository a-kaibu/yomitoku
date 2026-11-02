---
title: 警告の表示だけを一時的に消して、あとで元に戻す
description: Composer の Silencer::suppress は、error_reporting のビットを引いて、警告や通知の表示を一時的に止めます。前の設定をスタックに積んでおくので、入れ子になっても元の状態に戻せます。
language: php
project: Composer
repo: https://github.com/composer/composer
license: MIT
copyright: Copyright (c) Nils Adermann, Jordi Boggiano
commit: "e1460b9e86fee91bf99dfde2dbe9d4fd8e325c1f"
file: src/Composer/Util/Silencer.php
lines: [33, 43]
function: Silencer::suppress
difficulty: 3
format: 2
tags: [防御的プログラミング, ビット演算, エラー処理]
---
## ひとことで

`Silencer::suppress` は、PHP のエラー表示の設定から、警告や通知などの表示だけを一時的に止める関数です。以前の設定はスタックに保存されるので、`restore` を呼べば元の設定に戻せます。ファイルが無いかどうかを確かめるような、警告が出ても構わない処理で使われます。

## コード

```php:line-numbers=33
    public static function suppress(?int $mask = null): int
    {
        if (!isset($mask)) {
            $mask = E_WARNING | E_NOTICE | E_USER_WARNING | E_USER_NOTICE | E_DEPRECATED | E_USER_DEPRECATED;
        }
        $old = error_reporting();
        self::$stack[] = $old;
        error_reporting($old & ~$mask);

        return $old;
    }
```

## 前提知識

- **`error_reporting`**: PHP が表示するエラーの種類を、ビットの組み合わせで設定する関数です。引数なしで呼ぶと、現在の設定を返します。
- **ビットの OR `|`**: 複数の種類を 1 つの数にまとめる演算です。`E_WARNING | E_NOTICE` は、2 つの種類を両方表す値になります。
- **ビットの否定 `~` と AND `&`**: `~` は、すべてのビットを反転します。`$old & ~$mask` は、`$old` のうち `$mask` に含まれないビットだけを残す、という意味になります。
- **`static` プロパティ `self::$stack`**: クラス全体で共有される配列です。ここに、設定を書き換える前の値を積んでいきます。
- **`?int`**: `int` か `null` のどちらかを受け取る型の指定です。

## 何をしているか

### 1. 止めるエラーの種類を決める

```php:line-numbers=35
        if (!isset($mask)) {
            $mask = E_WARNING | E_NOTICE | E_USER_WARNING | E_USER_NOTICE | E_DEPRECATED | E_USER_DEPRECATED;
        }
```

引数で種類が指定されなければ、警告、通知、非推奨の 3 組を止める既定の組み合わせを使います。致命的なエラー（`E_ERROR`）は、この組み合わせに入っていません。止めてはいけないエラーが、誤って消されないようになっています。

### 2. 今の設定を保存する

```php:line-numbers=38
        $old = error_reporting();
        self::$stack[] = $old;
```

現在の設定を `$old` に読み取り、スタックの末尾に積みます。同じ関数が入れ子で呼ばれても、どの段階の設定かが保たれます。

### 3. 指定の種類だけを外す

```php:line-numbers=40
        error_reporting($old & ~$mask);

        return $old;
```

`~$mask` で止める種類以外のビットを作り、`$old` と AND を取ります。その結果を設定すると、指定された種類だけが表示されなくなります。戻り値の `$old` は、呼び出し側が必要なら使えるように返します。

## ここがすごい

- **消すものだけを引く**: 設定をすべて上書きせず、指定したビットだけを外しています。他の種類の設定は、そのまま残ります。
- **スタックで入れ子に対応**: 直前の設定を覚えておくので、`suppress` が重なって呼ばれても、`restore` で 1 段ずつ戻せます。
- **危険な種類は既定から外す**: 既定の組み合わせに `E_ERROR` を含めていません。うっかり致命的なエラーまで隠すことを防いでいます。
- **ビット演算を 1 行で表す**: 「今の設定から、この種類だけを消す」という操作を、AND と NOT の 1 行で書いています。

## まとめ

- エラー表示を一時的に止めるには、現在の設定を保存してから、必要なビットだけを外す。
- 保存先をスタックにすると、入れ子の呼び出しでも元の状態に戻せる。
- 既定で止める種類は、致命的なエラーを含まないように選ぶ。
- ビットの AND と NOT を組み合わせると、一部の設定だけを安全に変えられる。
