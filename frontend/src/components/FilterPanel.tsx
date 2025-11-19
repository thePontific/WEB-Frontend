import type { FC } from 'react'
import { Card, Form, Row, Col, Button } from 'react-bootstrap'

interface Props {
  onFilter: () => void; // Упрощаем - без параметров
  loading?: boolean;
}

const FilterPanel: FC<Props> = ({ onFilter, loading }) => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onFilter(); // Просто вызываем без параметров
  };

  const handleReset = () => {
    onFilter();
  };

  return (
    <Card className="mb-4" style={{ background: 'black', border: '1px solid #333' }}>
      <Card.Header style={{ background: '#111', border: 'none' }}>
        <h5 className="mb-0 text-white">Фильтры поиска (в разработке)</h5>
      </Card.Header>
      <Card.Body style={{ background: 'black' }}>
        <Form onSubmit={handleSubmit}>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label className="text-white">Название звезды</Form.Label>
                <Form.Control
                  type="text"
                  name="starname"
                  placeholder="Фильтрация скоро будет..."
                  style={{ background: '#111', border: '1px solid #333', color: 'white' }}
                  disabled
                />
              </Form.Group>
            </Col>
          </Row>

          <div className="d-flex gap-2">
            <Button type="submit" variant="primary" disabled>
              Фильтры скоро будут
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );
};

export default FilterPanel;