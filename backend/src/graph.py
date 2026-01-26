import pickle
import sqlite3
from pathlib import Path
from typing import NamedTuple

from networkx import NetworkXNoPath, NodeNotFound, MultiGraph, dfs_edges, shortest_path

from src.database import LevelOfDetail, level_of_detail_table
from src.hierarchy import HierarchyInput


class ConnectivityGraph(NamedTuple):
    graph: MultiGraph  # type: ignore[type-arg]
    edges_to_nodes: dict[str, tuple[str, str]]


def write_connectivity_graph(connectivity_graph: ConnectivityGraph, path: Path) -> None:
    with open(path / "graph.pickle", "wb") as f:
        pickle.dump(connectivity_graph.graph, f)

    with open(path / "edges_to_nodes.pickle", "wb") as f:
        pickle.dump(connectivity_graph.edges_to_nodes, f)


def read_connectivity_graph(path: Path) -> ConnectivityGraph:
    with open(path / "graph.pickle", "rb") as f:
        graph: MultiGraph = pickle.load(f)  # type: ignore[type-arg]

    with open(path / "edges_to_nodes.pickle", "rb") as f:
        nodes_to_edges: dict[str, tuple[str, str]] = pickle.load(f)

    return ConnectivityGraph(graph, nodes_to_edges)


def get_connectivity_graph(
    hierarchy_input: HierarchyInput, graph_path: Path
) -> ConnectivityGraph | None:
    if hierarchy_input.gxp_code is None:
        return None

    return read_connectivity_graph(graph_path / hierarchy_input.gxp_code)


def connectivity_to_graph(
    connection: sqlite3.Connection, hierarchy_input: HierarchyInput | None = None
) -> ConnectivityGraph:
    table_name: str = level_of_detail_table(LevelOfDetail.ALL)

    additional_where_clause: str = ""
    parameters: list[str] = []
    if hierarchy_input is not None:
        where_clause, extra_parameters = hierarchy_input.create_sql_where_clause()
        additional_where_clause = where_clause
        parameters = extra_parameters

    cursor = connection.cursor()

    sql: str = f"""
    SELECT
        name,
        node_1,
        node_2,
        normal_position
    FROM {table_name}
    WHERE out_of_order_indicator = 'INS'
    {additional_where_clause};
    """
    cursor.execute(sql, parameters)

    rows = cursor.fetchall()

    G: MultiGraph = MultiGraph()  # type: ignore[type-arg]

    edges_to_nodes: dict[str, tuple[str, str]] = {}
    for row in rows:
        edge_name: str = row[0]
        node_1: str = row[1]
        node_2: str | None = row[2]
        normal_position: bool = bool(row[3])

        G.add_node(node_1)
        if node_2 is None:
            continue
        G.add_node(node_2)

        if normal_position:
            G.add_edge(node_1, node_2, edge_name)
            edges_to_nodes[edge_name] = (node_1, node_2)

    cursor.close()

    return ConnectivityGraph(G, edges_to_nodes)


def graph_shortest_path(
    hierarchy_input: HierarchyInput,
    graph_path: Path,
    node_a: str,
    node_b: str,
    edges_to_exclude: list[str],
) -> list[str]:
    connectivity_graph: ConnectivityGraph | None = get_connectivity_graph(
        hierarchy_input, graph_path
    )
    if connectivity_graph is None:
        return []

    if not connectivity_graph.graph.has_node(node_a) or not connectivity_graph.graph.has_node(
        node_b
    ):
        return []

    for edge in edges_to_exclude:
        if edge not in connectivity_graph.edges_to_nodes:
            continue
        a, b = connectivity_graph.edges_to_nodes[edge]
        if connectivity_graph.graph.has_edge(a, b, edge):
            connectivity_graph.graph.remove_edge(a, b, edge)

    def cleanup() -> None:
        for edge in edges_to_exclude:
            if edge not in connectivity_graph.edges_to_nodes:
                continue
            a, b = connectivity_graph.edges_to_nodes[edge]
            connectivity_graph.graph.add_edge(a, b, edge)

    try:
        node_path: list[str] = shortest_path(connectivity_graph.graph, node_a, node_b)
    except (NetworkXNoPath, NodeNotFound):
        cleanup()
        return []
    edge_path: list[str] = []
    for i, current_node in enumerate(node_path):
        if i == 0:
            continue
        previous_node: str = node_path[i - 1]
        edges: list[str] = list(
            connectivity_graph.graph.get_edge_data(  # type: ignore[arg-type]
                current_node,
                previous_node,
            ).keys()
        )
        found_edge: str = edges[0]
        edge_path.append(found_edge)

    cleanup()

    return edge_path


def graph_flood_fill(
    hierarchy_input: HierarchyInput,
    graph_path: Path,
    node: str,
    edges_to_exclude: list[str],
) -> list[str]:
    connectivity_graph: ConnectivityGraph | None = get_connectivity_graph(
        hierarchy_input, graph_path
    )
    if connectivity_graph is None:
        return []

    if not connectivity_graph.graph.has_node(node):
        return []

    for edge in edges_to_exclude:
        if edge not in connectivity_graph.edges_to_nodes:
            continue
        a, b = connectivity_graph.edges_to_nodes[edge]
        if connectivity_graph.graph.has_edge(a, b, edge):
            connectivity_graph.graph.remove_edge(a, b, edge)

    def cleanup() -> None:
        for edge in edges_to_exclude:
            if edge not in connectivity_graph.edges_to_nodes:
                continue
            a, b = connectivity_graph.edges_to_nodes[edge]
            connectivity_graph.graph.add_edge(a, b, edge)

    try:
        edge_path: list[str] = []
        for node_a_b in dfs_edges(connectivity_graph.graph, source=node, depth_limit=1000):
            a, b = node_a_b
            edges: list[str] = list(
                connectivity_graph.graph.get_edge_data(a, b).keys()  # type: ignore[arg-type]
            )
            found_edge: str = edges[0]
            edge_path.append(found_edge)
    except Exception:
        cleanup()
        return []

    cleanup()

    return edge_path
