drop table if exists celebrities;
create table celebrities(
	id integer not null,
	name text not null,
	movie_id integer not null,
	movie_name text not null,
	role text not null,
	primary key (id, movie_id)
);