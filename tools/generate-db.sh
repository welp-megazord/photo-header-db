#!/usr/bin/env bash

set -e

if [[ $# -ne 2 ]]; then
    echo "Usage: generate-db.sh RECORDS DESTINATION"
    exit 1
else
    record_count="$1"
    destination="$2"
fi

if [[ $record_count -ge 10000 ]]; then
    small_table_record_count=$(( $record_count / 1000 ))
else
    small_table_record_count=$record_count
fi

echo -e "-- This file is generated programmatically\n" > "${destination}"

cat << EOF >> "${destination}"
drop table if exists photos;
drop table if exists users_restaurants;
drop table if exists users;
drop table if exists restaurants;

create table users (
    id int generated by default as identity,
    name varchar(50) not null
);

create table restaurants (
    id int generated by default as identity,
    name varchar(250) not null,
    address varchar(250) not null,
    phone_number varchar(50) not null,
    url varchar(250) not null,
    google_map varchar(2500) not null,
    categories varchar(50) not null
);

create table photos (
    id int generated by default as identity,
    url varchar(250),
    comment varchar(50),
    user_id int,
    restaurant_id int
);

create table users_restaurants (
    user_id int,
    restaurant_id int
);
EOF

echo -e "\ncopy users from stdin;" >> "${destination}"
tools/generate-data.js users $record_count >> "${destination}"
echo "\\." >> "${destination}"

echo -e "\ncopy restaurants from stdin;" >> "${destination}"
tools/generate-data.js restaurants $record_count >> "${destination}"
echo "\\." >> "${destination}"

echo -e "\ncopy photos from stdin;" >> "${destination}"
tools/generate-data.js photos $small_table_record_count >> "${destination}"
echo "\\." >> "${destination}"

echo -e "\ncopy users_restaurants from stdin;" >> "${destination}"
tools/generate-data.js users_restaurants $small_table_record_count >> "${destination}"
echo "\\." >> "${destination}"

cat << EOF >> "${destination}"

alter table users add constraint users_pkey primary key (id);

alter table restaurants add constraint restaurants_pkey primary key (id);

alter table photos add constraint photos_key primary key (id);

alter table photos add constraint photos_user_id_fkey foreign key (user_id) references users (id);

alter table photos add constraint photos_restaurant_id_fkey foreign key (restaurant_id) references restaurants (id);

alter table users_restaurants add constraint users_restaurants_pkey primary key (user_id, restaurant_id);

alter table users_restaurants add constraint users_restaurants_user_id_fkey foreign key (user_id) references users (id);

alter table users_restaurants add constraint users_restaurants_restaurant_id_fkey foreign key (restaurant_id) references restaurants (id);

create unique index user_name_idx on users (name);
EOF
