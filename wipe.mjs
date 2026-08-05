import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://mxltfkrcxxhqpblrbkyz.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bHRma3JjeHhocXBibHJia3l6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODUyNDk2NjQsImV4cCI6MjEwMDgyNTY2NH0.fOMoI1EuZA3lKbjKIfP6x2h5AnznjmHBenrIt4Ho-Og');
async function run() { await supabase.from('budget_allocations').delete().neq('id', '0'); await supabase.from('requests').delete().neq('id', '0'); console.log('done'); }
run();
