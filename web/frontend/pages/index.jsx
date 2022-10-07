import { useCallback, useState } from "react";
import {
  Card,
  ChoiceList,
  Page,
  Layout,
  TextContainer,
  TextField,
  Checkbox,
  Spinner,
  Button,
  Thumbnail,
  Heading,
  Stack,
} from "@shopify/polaris";
import {
  ImageMajor
} from "@shopify/polaris-icons";
import { TitleBar, Toast } from "@shopify/app-bridge-react";

import { ProductsCard } from "../components";
import { useAuthenticatedFetch } from "../hooks";

export default function HomePage() {
  const authenticatedFetch = useAuthenticatedFetch();

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [url, setUrl] = useState();
  const [token, setToken] = useState();
  const [showToken, setShowToken] = useState(false);
  const [settings, setSettings] = useState([]);
  const [newProduct, setNewProduct] = useState(null);

  const handleSettingChange = useCallback((value) => setSettings(value), []);

  const handleCloneProduct = useCallback(async () => {
    setLoading(true);
    setNewProduct(null);

    try {
      const rawProductUrl = url
        .split(`?`)[0] // Drop parameters like ?variant=
        .replace("https://", "https://") // Make sure it's https
        .replace(".json", ""); // Drop .json as we add it

      const productData = await fetch(`${rawProductUrl}.json`).then(res => res?.json());

      if (!productData) {
        throw `Failed to fetch product data`;
      }

      // Send product data to backend proxy resource
      const result = await authenticatedFetch(`/api/products/create`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(productData)
      }).then(res => res?.json());
      console.log("result", result);

      if (!result?.success) {
        setNewProduct(null);
        throw `Product creation failed`
      }      

      setToast({
        show: true,
        content: `Created product`,
      });

      setNewProduct({
        id: result.productId,
        shop: result.shop,
        imageUrl: productData?.product?.image?.src || null,
        title: productData?.product?.title,
      });
    } catch (e) {
      console.warn(e);

      setToast({
        show: true,
        error: true,
        content: `${e}`,
      });
    }

    setLoading(false);
  }, [url, settings, token]);

  return (
    <Page narrowWidth>
      <TitleBar title="Shoplift" primaryAction={null} />
      {toast && toast.show ? (
        <Toast
          content={toast.content}
          onDismiss={() => setToast({})}
          error={toast.error}
        />
      ) : null}  
      <Layout>
        <Layout.Section>
          <Card 
            title="Product to copy" 
            sectioned 
            primaryFooterAction={{
              content: "Copy and create",
              disabled: !url,
              loading: loading,
              onAction: handleCloneProduct
            }}
          >
            <TextContainer spacing="loose">
              <TextField 
                label="Product url" 
                value={url} 
                onChange={(newValue) => setUrl(newValue)} 
              />
            </TextContainer>
          </Card>
          {newProduct && (
            <Card sectioned title="Success! Product copied to your store.">
              <Card sectioned subdued>
                <Stack alignment="center" distribution="equalSpacing">
                  <Stack alignment="center">
                    <Thumbnail source={newProduct.imageUrl || ImageMajor} />
                    <Heading>{newProduct.title}</Heading>
                  </Stack>
                  <Button external url={`https://${newProduct.shop}/admin/products/${newProduct.id}`}>View in admin</Button>
                </Stack>
              </Card>
            </Card>
          )}
          {/* <Card sectioned title="Advanced settings">
            <Checkbox 
              label="Access token" 
              helpText="Enter an access token to access private data like metafields" 
              checked={showToken} 
              onChange={() => setShowToken(true)} 
            />
            {showToken && (
              <Card sectioned subdued>
                <TextField label="Access token" value={token} onChange={(newValue) => setToken(newValue)} />
                <ChoiceList
                  allowMultiple
                  title="Optional settings"
                  choices={[
                    {label: 'Copy metafields', value: 'metafields'},
                  ]}
                  selected={settings}
                  onChange={handleSettingChange}
                />
              </Card>
            )}
          </Card> */}
        </Layout.Section>
      </Layout>
    </Page>
  );
}
