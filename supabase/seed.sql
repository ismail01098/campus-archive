insert into public.courses(name,code) values
('Bachelor of Computer Applications','BCA'),
('Bachelor of Commerce','BCOM'),
('Bachelor of Business Administration','BBA')
on conflict do nothing;
insert into public.semesters(name,sort_order) values
('Semester 1',1),('Semester 2',2),('Semester 3',3),('Semester 4',4),
('Semester 5',5),('Semester 6',6),('Semester 7',7),('Semester 8',8)
on conflict(name) do nothing;
-- Add subjects for your college through Supabase Table Editor or an admin catalog screen.
