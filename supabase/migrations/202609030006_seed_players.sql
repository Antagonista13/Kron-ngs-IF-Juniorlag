-- Starttrupp från uppladdade medlemsfiler.
-- Endast godkända fält: namn, spelarens mobilnummer och födelsedatum.
insert into public.players (full_name, mobile_phone, birth_date)
select v.full_name, nullif(v.mobile_phone, ''), v.birth_date::date
from (values
  ('Abdulazzim Hakmi', '0762270656', '2011-01-02'),
  ('Adam Gustafsson', '0708362609', '2010-07-01'),
  ('Agaton Mossberg', '0793135254', '2010-05-08'),
  ('Ali Shek Mohammad', '0793490386', '2010-01-22'),
  ('August Nilsson', '0793356832', '2009-04-09'),
  ('Axel Venhagen', '0727498899', '2011-07-15'),
  ('Christian Musingo', '0722349270', '2011-12-27'),
  ('Colin Carlsson', '0768610445', '2010-08-03'),
  ('Daniel Gebru', '076-145 34 48', '2011-02-21'),
  ('Dijwar Suleiman', '0760880373', '2008-10-28'),
  ('Eddie Valkonen', '0793397061', '2010-04-11'),
  ('Emil Bergqvist', '0725666676', '2011-01-10'),
  ('Erik Isaksson', '0763374597', '2009-09-22'),
  ('Hamsa Xasan', '0763374889', '2009-05-25'),
  ('Hugo Holsten', '0763266082', '2011-10-31'),
  ('Isack Abrahaley Gebru', '0793347586', '2009-10-19'),
  ('Jamil Sheikh Mohamed', '0729379286', '2009-01-02'),
  ('Max Brunnegård', '0763913414', '2010-06-17'),
  ('Melker Ottosson', '0729080101', '2010-09-27'),
  ('Melvin Svensson', '0735030732', '2009-05-19'),
  ('Mohamed Abdulaziz', '0738783643', '2009-07-28'),
  ('Mohamed Ali', '0737455305', '2009-01-28'),
  ('Noel Aspholmer', '0705432209', '2010-06-22'),
  ('Ogulcan Yilmaz', '0735864643', '2011-03-17'),
  ('Omar Alhembazli', '0761197732', '2011-04-24'),
  ('Rodan Sweir Kuli', '+46 76 057 87 46', '2010-06-01'),
  ('Roney Hussein', null, '2011-09-25'),
  ('Abdurrazaq "Zacki" Qayyum', '0723222025', '2011-12-08'),
  ('Ahmad Hamdan', '0721508501', '2011-01-01'),
  ('Amir Alshaboul', '+46762952644', '2011-11-07'),
  ('Amirali Rezaee', '0761874442', '2011-08-31'),
  ('Benjamin Maloku', '0763213186', '2011-10-19'),
  ('Colin Ciurana', '0763043802', '2011-05-23'),
  ('Gabriel Carlsson', '0733032846', '2010-05-10'),
  ('Imran Selemankhel', '0768603525', '2011-11-16'),
  ('Jassine Kriaa', '0769118760', '2011-10-20'),
  ('Leo Teow', '0700137362', '2011-03-30'),
  ('Melker Sandström', '0793136606', '2011-09-23'),
  ('Mohammad Alheraky', '0762513331', '2011-03-27'),
  ('Mustafa Hasem', '0793411073', '2011-08-27'),
  ('Omar Khashfi', '0762383471', '2010-01-30'),
  ('Robin Zweck', '0737641244', '2011-07-09'),
  ('Ubeyd Abdi', '0739108837', '2011-06-19')
) as v(full_name, mobile_phone, birth_date)
where not exists (
  select 1
  from public.players p
  where lower(trim(p.full_name)) = lower(trim(v.full_name))
    and p.birth_date is not distinct from v.birth_date::date
);
