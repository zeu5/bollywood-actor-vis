drop table if exists celebrities;
create table celebrities(
	id integer not null,
	name text not null,
	movie_id integer not null,
	movie_name text not null,
	role text not null,
	primary key (id, movie_id)
);

drop table if exists celebrity_map;
create table celebrity_map(
	actor1_id integer not null,
	actor1_name text not null,
	actor2_id integer not null,
	actor2_name text not null,
	movie_id integer not null,
	movie_name text not null,
	primary key (actor1_id, actor2_id, movie_id)
);