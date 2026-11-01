---
title: "同じ人のメールアドレス違いを、まとめて数える"
description: "作者ごとの行数を、メールアドレスと名前の組で集計し、同じ名前に別のメールが付いている場合は行数を 1 つにまとめる関数。"
language: shell
project: "git-extras"
repo: https://github.com/tj/git-extras
license: "MIT"
copyright: "Copyright (c) 2010 TJ Holowaychuk <tj@vision-media.ca> and Contributors"
commit: "a754386dbfb85e23e766eccbb3885d635115d013"
file: "bin/git-summary"
lines: [102, 137]
function: "dedup_by_email"
difficulty: 3
format: 2
tags: [文字列処理, 設計パターン, CLI]
---
## ひとことで

`dedup_by_email` は、**同じ人が違うメールアドレスで書いたコミットを、1 人分にまとめて数える** 関数です。作者ごとの行数の集計を、正しい人数の単位に直します。

Git では、同じ人でも、設定によってメールアドレスの大文字小文字や、別のアドレスが混ざります。そのままでは、同じ人が別々に数えられてしまいます。この関数は、その食い違いを埋めます。

## コード

::: code-group

```bash:line-numbers=102 [日本語訳]
dedup_by_email() {
    # in:
    # 例: 27 件の行数、名前 luo zexuan、メール LuoZexuan@xxx.com
    #  7  罗泽轩 <luozexuan@xxx.com>
    # 出力の例です。
    # 例: 34 件の行数、名前 luo zexuan
    LC_ALL=C awk '
    {
        sum += $1
        last_field = tolower($NF)
        if (last_field in emails) {
            emails[last_field] += $1
        } else {
            email = last_field
            emails[email] = $1
            # 行数とメールを空にして、名前だけを残します。
            $1=$NF=""
            sub(/^[[:space:]]+/, "", $0)
            sub(/[[:space:]]+$/, "", $0)
            name = $0
            if (name in names) {
                # 同じ名前が既に別のメールで登録されている場合は、
                # 前のメールの行数を後のメールに合流させます。
                emails[email] += emails[names[name]]
                emails[names[name]] = 0
            }
            names[name] = email
        }
    }
    END {
        for (name in names) {
            email = names[name]
            printf "%6d\t%s\n", emails[email], name
        }
    }' | sort -rn -k 1
}
```

```bash:line-numbers=102 [原文]
dedup_by_email() {
    # in:
    # 27  luo zexuan <LuoZexuan@xxx.com>
    #  7  罗泽轩 <luozexuan@xxx.com>
    # out:
    # 34 luo zexuan
    LC_ALL=C awk '
    {
        sum += $1
        last_field = tolower($NF)
        if (last_field in emails) {
            emails[last_field] += $1
        } else {
            email = last_field
            emails[email] = $1
            # set commits/email to empty
            $1=$NF=""
            sub(/^[[:space:]]+/, "", $0)
            sub(/[[:space:]]+$/, "", $0)
            name = $0
            if (name in names) {
                # when the same name is associated with existed email,
                # merge the previous email into the later one.
                emails[email] += emails[names[name]]
                emails[names[name]] = 0
            }
            names[name] = email
        }
    }
    END {
        for (name in names) {
            email = names[name]
            printf "%6d\t%s\n", emails[email], name
        }
    }' | sort -rn -k 1
}
```

:::

## 前提知識

- **`awk` の連想配列**: 文字の鍵に値を結びつける仕組みです。ここでは、メールアドレスや名前を鍵にして、行数を足していきます。
- **`tolower`**: 文字列を小文字にする awk の関数です。大文字小文字の違いを無くすために使います。
- **`LC_ALL=C`**: 文字の扱いを、標準の固定の形にする設定です。
- **`sort -rn`**: 数字として、大きい順に並べ替えるコマンドです。
- **入力の形**: 前段の処理から、「行数 作者名 <メール>」の形の行が渡されます。

## 何をしているか

### 1. 行数を足し、メールを小文字にする

```bash:line-numbers=107
    # 例: 34 件の行数、名前 luo zexuan
    LC_ALL=C awk '
    {
```

各行の先頭の数を合計に足します。末尾のメールアドレスを小文字にして、同じものとして扱えるようにします。

### 2. 同じメールなら行数だけ足す

```bash:line-numbers=110
        sum += $1
        last_field = tolower($NF)
        if (last_field in emails) {
```

そのメールが既に記録されていれば、行数を足すだけで終わります。

### 3. 新しいメールなら名前を整えて登録する

```bash:line-numbers=113
            emails[last_field] += $1
        } else {
            email = last_field
            emails[email] = $1
            # 行数とメールを空にして、名前だけを残します。
            $1=$NF=""
            sub(/^[[:space:]]+/, "", $0)
            sub(/[[:space:]]+$/, "", $0)
            name = $0
```

初めてのメールでは、行数を登録します。行から行数とメールを除き、前後の空白を取って名前だけにします。

### 4. 同じ名前に別のメールがあれば合流させる

```bash:line-numbers=122
            if (name in names) {
                # 同じ名前が既に別のメールで登録されている場合は、
                # 前のメールの行数を後のメールに合流させます。
                emails[email] += emails[names[name]]
                emails[names[name]] = 0
            }
            names[name] = email
```

同じ名前が既に別のメールで登録されていれば、その行数を新しいメールに合流させ、古い方は 0 にします。

### 5. 名前ごとに表示する

```bash:line-numbers=131
    END {
        for (name in names) {
            email = names[name]
            printf "%6d\t%s\n", emails[email], name
        }
    }' | sort -rn -k 1
```

最後に、名前ごとに対応するメールの行数を表示し、多い順に並べ替えます。

## ここがすごい

- **二つの鍵で照合する**: メールと名前の両方で、同じ人かを判断しています。どちらか一方だけでは、取りこぼしや誤りが起きるためです。
- **1 回の走査で済ませる**: 全行を一度だけ読み、集計と合流を同時に行います。大きな履歴でも効率的です。
- **コメントで意図を残す**: 合流の理由を、コードの近くに書いています。後から読む人が、判断の背景を追えます。

## まとめ

- 同じ対象の表記ゆれは、複数の鍵で照合すると取りこぼしが減る。
- 集計は、一回の走査で済ませると効率的。
- 合流の理由は、コードの近くに書いておくと後で役立つ。
