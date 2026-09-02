# Fase 3.22a — Feed Hotfix

A causa do erro do filtro **Museu** era uma divergência de identificadores:
- UI: `museu`
- RPC `get_community_activity_feed`: `museum`

O hotfix centraliza essa tradução antes da chamada ao Supabase.
Também adiciona proteção contra respostas assíncronas fora de ordem e deduplicação na paginação.
