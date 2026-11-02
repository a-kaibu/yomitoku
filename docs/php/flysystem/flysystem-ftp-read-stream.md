---
title: FTP のファイルを、一時的なストリームへ読み込む
description: Flysystem の FtpAdapter の readStream は、FTP サーバー上のファイルを、メモリや一時ファイルに作られた PHP のストリームへ取り込みます。失敗したときは、ストリームを閉じてから、原因の分かる例外を投げます。
language: php
project: Flysystem
repo: https://github.com/thephpleague/flysystem
license: MIT
copyright: Copyright (c) 2013-2026 Frank de Jonge
commit: "1e748897e0a8e897b5a8bc8942e05f4f57fa248c"
file: src/Ftp/FtpAdapter.php
lines: [204, 219]
function: readStream
difficulty: 2
format: 2
tags: [ネットワーク, ファイル, 入出力]
---
## ひとことで

`readStream` は、FTP サーバーにあるファイルを、PHP のストリームとして取り出す関数です。ファイルをいったんローカルに保存せず、`php://temp` という一時的な入れ物へ直接読み込みます。読み込みに失敗したときは、ストリームを閉じてから、ファイルの場所を含むエラーを投げます。

## コード

```php:line-numbers=204
    public function readStream(string $path)
    {
        $location = $this->prefixer()->prefixPath($path);
        $stream = fopen('php://temp', 'w+b');
        $result = @ftp_fget($this->connection(), $stream, $location, $this->connectionOptions->transferMode());

        if ( ! $result) {
            fclose($stream);

            throw UnableToReadFile::fromLocation($path, error_get_last()['message'] ?? '');
        }

        rewind($stream);

        return $stream;
    }
```

## 前提知識

- **Flysystem**: ローカルのファイル、クラウドのストレージ、FTP などを、同じ書き方で扱うための PHP のライブラリです。その共通の操作の一つが、`readStream` です。
- **ストリーム**: データを順に読み書きする仕組みです。ファイルの大きさに関係なく、少しずつ扱えます。
- **`php://temp`**: 小さいうちはメモリに、大きくなると一時ファイルに置かれる、PHP の特別な入れ物です。
- **`ftp_fget`**: FTP サーバーのファイルを、開いているストリームへ書き込む PHP の関数です。成功すると `true` を返します。
- **`@` の抑制**: 関数の前に付けると、そのときのエラーの表示を止めます。代わりに、後で `error_get_last` でエラーの内容を取り出せます。

## 何をしているか

### 1. ファイルの場所と、一時ストリームを用意する

```php:line-numbers=206
        $location = $this->prefixer()->prefixPath($path);
        $stream = fopen('php://temp', 'w+b');
```

`prefixPath` で、ファイルの名前に、設定された接頭辞を付けて場所を作ります。そして `php://temp` を、書き込みと読み込みができるバイナリモードで開きます。

### 2. FTP からストリームへ取り込む

```php:line-numbers=208
        $result = @ftp_fget($this->connection(), $stream, $location, $this->connectionOptions->transferMode());
```

`ftp_fget` で、サーバー上のファイルを、用意したストリームへ書き込みます。`@` を付けて、失敗時の警告が画面に出ないようにしています。戻り値が `false` なら、読み込みは失敗です。

### 3. 失敗したら閉じて、例外を投げる

```php:line-numbers=210
        if ( ! $result) {
            fclose($stream);

            throw UnableToReadFile::fromLocation($path, error_get_last()['message'] ?? '');
```

失敗したときは、開いたストリームを `fclose` で閉じます。そのあと、`error_get_last` で最後のエラーの内容を取り出し、`UnableToReadFile` という例外に入れて投げます。取り出したエラーが無い場合は、空の文字列を使います。

### 4. 成功なら先頭に戻して返す

```php:line-numbers=216
        rewind($stream);

        return $stream;
```

成功したときは、`rewind` で読み取り位置を先頭に戻し、ストリームを返します。受け取った側は、すぐに先頭から読めます。

## ここがすごい

- 中間のファイルを作らずに、FTP のデータを直接ストリームへ流し込んでいます。保存先を用意する手間と、後始末が省けます。
- 失敗のときは、ストリームを閉じてから例外を投げるので、開いた資源を漏らしません。後始末の順番を、コードの流れで明確にしています。
- `@` と `error_get_last` の組み合わせで、警告を画面に出さず、原因だけを例外に残しています。利用者には、整った形のエラーとして届きます。
- Flysystem の共通の例外 `UnableToReadFile` を使うので、FTP でもクラウドでも、同じ方法で失敗を扱えます。

## まとめ

`readStream` は、FTP のファイルを一時ストリームへ直接読み込み、先頭に戻して返す関数です。失敗時は後始末をしてから、原因の分かる例外を投げます。ネットワーク越しの読み込みを、後始末まで含めて丁寧に組み立てている、良い見本になっています。
