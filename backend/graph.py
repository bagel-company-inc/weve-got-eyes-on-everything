from typing import NamedTuple

from pandas import DataFrame
from networkx import NetworkXNoPath, NodeNotFound, MultiGraph, shortest_path


class ConnectivityGraph(NamedTuple):
    graph: MultiGraph
    edges_to_nodes: dict[str, tuple[str, str]]


def connectivity_to_graph(connectivity: DataFrame, attributes: bool = False) -> ConnectivityGraph:
    assert not attributes, "Attributes not implemented yet"
    G = MultiGraph()
    edges_to_nodes: dict[str, tuple[str, str]] = {}
    for row in connectivity.itertuples():
        node_a: str = row.node_1
        node_b: str | None = row.node_2
        edge_name: str = row.name

        G.add_node(node_a)
        if node_b is None:
            continue
        G.add_node(node_b)

        if row.normal_position:
            G.add_edge(node_a, node_b, edge_name)
            edges_to_nodes[edge_name] = (node_a, node_b)

    return ConnectivityGraph(G, edges_to_nodes)


def graph_shortest_path(
    node_a: str, node_b: str, graph: ConnectivityGraph, edges_to_exclude: list[str]
) -> list[str]:
    if not graph.graph.has_node(node_a) or not graph.graph.has_node(node_b):
        return []

    for edge in edges_to_exclude:
        if edge not in graph.edges_to_nodes:
            continue
        a, b = graph.edges_to_nodes[edge]
        if graph.graph.has_edge(a, b, edge):
            graph.graph.remove_edge(a, b, edge)

    def cleanup() -> None:
        for edge in edges_to_exclude:
            if edge not in graph.edges_to_nodes:
                continue
            a, b = graph.edges_to_nodes[edge]
            graph.graph.add_edge(a, b, edge)

    try:
        node_path: list[str] = shortest_path(graph.graph, node_a, node_b)
    except (NetworkXNoPath, NodeNotFound):
        cleanup()
        return []
    edge_path: list[str] = []
    for i, current_node in enumerate(node_path):
        if i == 0:
            continue
        previous_node: str = node_path[i - 1]
        edges: list[str] = list(graph.graph.get_edge_data(current_node, previous_node).keys())
        edge: str = edges[0]
        edge_path.append(edge)

    cleanup()

    return edge_path
